import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { SearchIndex } from '@/models';
import { advancedSearchSchema } from '@/lib/validation/search';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// POST /api/search/advanced - Advanced search with multiple criteria
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = advancedSearchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { 
      criteria, 
      entityTypes, 
      logicalOperator, 
      limit, 
      offset, 
      sortBy, 
      sortOrder 
    } = validationResult.data;

    // Build advanced search query
    const searchConditions = criteria.map(criterion => {
      const { field, operator, value } = criterion;

      switch (field) {
        case 'content':
          return buildFieldQuery('content', operator, value);
        case 'title':
          return buildFieldQuery('metadata.title', operator, value);
        case 'description':
          return buildFieldQuery('metadata.description', operator, value);
        case 'tags':
          return buildFieldQuery('tags', operator, value);
        case 'name':
          return buildFieldQuery('metadata.name', operator, value);
        default:
          throw new Error(`Unsupported search field: ${field}`);
      }
    });

    let searchQuery: any = {};

    if (logicalOperator === 'AND') {
      searchQuery.$and = searchConditions;
    } else {
      searchQuery.$or = searchConditions;
    }

    // Filter by entity types
    if (entityTypes && entityTypes.length > 0) {
      searchQuery.entityType = { $in: entityTypes };
    }

    // Apply permission filtering
    if (user.role !== 'admin') {
      const permissionQuery = {
        $or: [
          { 'permissions.viewableBy': user.id },
          { 'permissions.roles': user.role }
        ]
      };

      if (searchQuery.$and) {
        searchQuery.$and.push(permissionQuery);
      } else {
        searchQuery = { $and: [searchQuery, permissionQuery] };
      }
    }

    // Build sort object
    let sort: any = {};
    if (sortBy === 'relevance') {
      sort = { score: { $meta: 'textScore' } };
    } else if (sortBy === 'date') {
      sort = { lastIndexed: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'name') {
      sort = { 'metadata.name': sortOrder === 'asc' ? 1 : -1 };
    }

    const searchResults = await SearchIndex.find(searchQuery)
      .populate('entityId')
      .sort(sort)
      .skip(offset)
      .limit(limit);

    const total = await SearchIndex.countDocuments(searchQuery);

    // Group results by entity type
    const resultsByType = searchResults.reduce((acc: any, result) => {
      const entityType = result.entityType;
      if (!acc[entityType]) {
        acc[entityType] = [];
      }
      acc[entityType].push(result);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        results: searchResults,
        resultsByType,
        criteria,
        logicalOperator,
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

// Helper function to build field-specific queries
function buildFieldQuery(field: string, operator: string, value: string): any {
  switch (operator) {
    case 'contains':
      return { [field]: { $regex: value, $options: 'i' } };
    case 'equals':
      return { [field]: value };
    case 'startsWith':
      return { [field]: { $regex: `^${value}`, $options: 'i' } };
    case 'endsWith':
      return { [field]: { $regex: `${value}$`, $options: 'i' } };
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}