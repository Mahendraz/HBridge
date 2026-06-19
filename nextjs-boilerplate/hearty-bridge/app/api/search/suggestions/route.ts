import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { SearchIndex } from '@/models';
import { searchSuggestionSchema } from '@/lib/validation/search';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/search/suggestions - Get search suggestions/autocomplete
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query'),
      entityType: searchParams.get('entityType'),
      limit: parseInt(searchParams.get('limit') || '10')
    };

    const validationResult = searchSuggestionSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { query, entityType, limit } = validationResult.data;

    // Build search query for suggestions
    const searchQuery: any = {
      content: { $regex: query, $options: 'i' }
    };

    if (entityType) {
      searchQuery.entityType = entityType;
    }

    // Apply permission filtering
    if (user.role !== 'admin') {
      searchQuery.$or = [
        { 'permissions.viewableBy': user.id },
        { 'permissions.roles': user.role }
      ];
    }

    // Get suggestions based on content and tags
    const contentSuggestions = await SearchIndex.find(searchQuery)
      .select('content entityType tags')
      .limit(Math.ceil(limit / 2));

    const tagSuggestions = await SearchIndex.find({
      tags: { $regex: query, $options: 'i' },
      ...entityType && { entityType }
    })
      .select('tags entityType')
      .limit(Math.ceil(limit / 2));

    // Extract unique suggestions
    const suggestions = new Set<string>();

    // Add content-based suggestions
    contentSuggestions.forEach(item => {
      const words = item.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });

    // Add tag-based suggestions
    tagSuggestions.forEach(item => {
      item.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    // Convert to array and limit
    const suggestionArray = Array.from(suggestions).slice(0, limit);

    // Get popular search terms (this could be cached or stored separately)
    const popularTerms = await getPopularSearchTerms(query, entityType, user.role, limit - suggestionArray.length);

    const allSuggestions = [...suggestionArray, ...popularTerms];

    return NextResponse.json({
      success: true,
      data: {
        suggestions: allSuggestions,
        query,
        entityType
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// Helper function to get popular search terms
async function getPopularSearchTerms(
  query: string, 
  entityType?: string, 
  userRole?: string, 
  limit: number = 5
): Promise<string[]> {
  try {
    // This is a simplified implementation
    // In production, you might want to track search analytics separately
    const aggregateQuery: any[] = [
      {
        $match: {
          content: { $regex: query, $options: 'i' },
          ...entityType && { entityType }
        }
      },
      {
        $group: {
          _id: null,
          words: { $push: { $split: ['$content', ' '] } }
        }
      },
      {
        $project: {
          words: {
            $reduce: {
              input: '$words',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      },
      {
        $unwind: '$words'
      },
      {
        $match: {
          words: { $regex: query, $options: 'i' }
        }
      },
      {
        $group: {
          _id: { $toLower: '$words' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ];

    const results = await SearchIndex.aggregate(aggregateQuery);
    return results.map(result => result._id);
  } catch (error) {
    console.error('Error getting popular search terms:', error);
    return [];
  }
}