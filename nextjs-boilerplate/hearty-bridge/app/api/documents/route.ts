import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Document, Child } from '@/models';
import { uploadDocumentSchema, documentQuerySchema } from '@/lib/validation/document';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';

// GET /api/documents - Retrieve documents with filtering
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const queryParams = {
      childId: searchParams.get('childId'),
      type: searchParams.get('type'),
      accessLevel: searchParams.get('accessLevel'),
      isConfidential: searchParams.get('isConfidential') === 'true' ? true : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      expiringWithinDays: searchParams.get('expiringWithinDays') ? 
        parseInt(searchParams.get('expiringWithinDays')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: searchParams.get('sortBy') || 'uploadedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    const validationResult = documentQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { 
      childId, 
      type, 
      accessLevel, 
      isConfidential, 
      tags, 
      expiringWithinDays,
      limit, 
      offset, 
      sortBy, 
      sortOrder 
    } = validationResult.data;

    // Build query based on user role and permissions
    const query: any = {};
    
    if (childId) {
      query.childId = childId;
      
      // Verify user has access to this child's documents
      if (user.role !== 'admin') {
        const child = await Child.findById(childId);
        if (!child) {
          return NextResponse.json({ error: 'Child not found' }, { status: 404 });
        }
        
        const hasAccess = child.parentId.toString() === user.userId ||
                         child.therapistId?.toString() === user.userId;
        
        if (!hasAccess) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }

    // Filter by document type
    if (type) {
      query.type = type;
    }

    // Filter by access level based on user role
    if (accessLevel) {
      query.accessLevel = accessLevel;
    } else {
      // Default access filtering based on user role
      if (user.role === 'parent') {
        query.accessLevel = { $in: ['parent-only', 'shared'] };
      } else if (user.role === 'therapist') {
        query.accessLevel = { $in: ['therapist-only', 'shared'] };
      }
      // Admin can see all
    }

    // Filter by confidentiality
    if (isConfidential !== undefined) {
      query.isConfidential = isConfidential;
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Filter by expiring documents
    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      
      query.expiryDate = {
        $lte: futureDate,
        $gte: new Date()
      };
    }

    // For non-admin users, only show documents they uploaded or have access to
    if (user.role !== 'admin' && !childId) {
      query.uploadedBy = user.userId;
    }

    // Build sort object
    const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
    const sort: any = {};
    sort[sortBy] = sortOrderValue;

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('childId', 'name')
      .sort(sort)
      .skip(offset)
      .limit(limit);

    const total = await Document.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        documents,
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

// POST /api/documents - Upload a new document
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = uploadDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      type,
      fileName,
      fileSize,
      mimeType,
      childId,
      expiryDate,
      tags,
      description,
      isConfidential,
      accessLevel,
      parentDocumentId,
      metadata
    } = validationResult.data;

    // Verify child access if childId is provided
    if (childId) {
      const child = await Child.findById(childId);
      if (!child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }
      
      if (user.role !== 'admin') {
        const hasAccess = child.parentId.toString() === user.userId ||
                         child.therapistId?.toString() === user.userId;
        
        if (!hasAccess) {
          return NextResponse.json({ error: 'Access denied to child' }, { status: 403 });
        }
      }
    }

    // Verify parent document if provided
    if (parentDocumentId) {
      const parentDoc = await Document.findById(parentDocumentId);
      if (!parentDoc) {
        return NextResponse.json({ error: 'Parent document not found' }, { status: 404 });
      }
    }

    // Note: In a real implementation, you would handle the actual file upload here
    // This could involve uploading to AWS S3, Google Cloud Storage, etc.
    const fileUrl = `/uploads/documents/${fileName}`;

    const document = new Document({
      title,
      type,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      childId: childId || undefined,
      uploadedBy: user.userId,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      tags: tags || [],
      description,
      isConfidential: isConfidential || false,
      accessLevel,
      parentDocument: parentDocumentId || undefined,
      metadata: metadata || {}
    });

    await document.save();

    // Populate the response
    await document.populate('uploadedBy', 'name email');
    if (childId) {
      await document.populate('childId', 'name');
    }

    return NextResponse.json({
      success: true,
      data: { document },
      message: 'Document uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});