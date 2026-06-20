import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { SearchIndex } from '@/models';
import { globalSearchSchema } from '@/lib/validation/search';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/search - Global search across all entities
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query'),
      entityTypes: searchParams.get('entityTypes')?.split(',').filter(Boolean),
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      filters: {
        childId: searchParams.get('childId'),
        userId: searchParams.get('userId'),
        dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
          startDate: searchParams.get('startDate')!,
          endDate: searchParams.get('endDate')!
        } : undefined,
        tags: searchParams.get('tags')?.split(',').filter(Boolean)
      }
    };

    const validationResult = globalSearchSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { query, entityTypes, limit, offset, filters } = validationResult.data;

    // Build search query
    const searchQuery: any = {
      $text: { $search: query }
    };

    // Filter by entity types
    if (entityTypes && entityTypes.length > 0) {
      searchQuery.entityType = { $in: entityTypes };
    }

    // Apply filters
    if (filters?.childId) {
      searchQuery['metadata.childId'] = filters.childId;
    }

    if (filters?.userId) {
      searchQuery['metadata.userId'] = filters.userId;
    }

    if (filters?.tags && filters.tags.length > 0) {
      searchQuery.tags = { $in: filters.tags };
    }

    if (filters?.dateRange) {
      searchQuery['metadata.date'] = {
        $gte: new Date(filters.dateRange.startDate),
        $lte: new Date(filters.dateRange.endDate)
      };
    }

    // Apply permission filtering
    if (user.role !== 'admin') {
      searchQuery.$or = [
        { 'permissions.viewableBy': user.userId },
        { 'permissions.roles': user.role }
      ];
    }

    const searchResults = await SearchIndex.find(searchQuery, {
      score: { $meta: 'textScore' }
    })
      .populate('entityId')
      .sort({ score: { $meta: 'textScore' } })
      .skip(offset)
      .limit(limit);

    const total = await SearchIndex.countDocuments(searchQuery);

    // Group results by entity type for better organization
    const resultsByType = searchResults.reduce((acc: any, result) => {
      const entityType = result.entityType;
      if (!acc[entityType]) {
        acc[entityType] = [];
      }
      acc[entityType].push({
        ...result.toObject(),
        relevanceScore: result.get('score')
      });
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        results: searchResults.map(result => ({
          ...result.toObject(),
          relevanceScore: result.get('score')
        })),
        resultsByType,
        query,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});