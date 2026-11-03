# Collect Profile Picture Route

This route handles collecting the user's profile picture during initial onboarding after account creation.

## Purpose

Allows newly registered users to upload or provide their profile picture as part of the onboarding process.

This is different from the "update profile picture" route because:
- This is for **initial data collection** (one-time operation)
- This is part of the **onboarding flow** for new users
- Users should not be able to submit this if they've already provided a profile picture
- This may have different validation or storage requirements for first-time uploads

## Folder Structure

```
collect_profile_picture/
├── index.ts
└── route/
    └── collect_profile_picture.route.ts
```

## Implementation Considerations

### 1. **HTTP Method**
- Use `POST` (not PATCH)
- This is creating new data, not updating existing data
- POST semantically represents "creating" a resource (the user's profile picture)

### 2. **Request Type**

**Option A: URL/Reference String (Simpler)**
```typescript
interface CollectProfilePictureRequestBody {
    profilePicture: string;  // URL or file reference
}
```

**Option B: File Upload (Recommended for production)**
Use `multer` for actual file uploads:
```typescript
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
```

### 3. **Pre-submission Validation**
Check if user has already provided a profile picture:
```typescript
const user = await this.prismaClient.user.findUnique({
    where: { id: req.user.userId }
});

if (user.profilePicture) {
    res.status(400).json({
        message: "Profile picture has already been provided",
        status: Status.failed
    });
    return;
}
```

This prevents users from submitting their profile picture multiple times.

### 4. **Validation**

**For URL/String approach:**
```typescript
if (!profilePicture) {
    res.status(400).json({
        message: "Profile picture is required",
        status: Status.failed
    });
    return;
}

// Validate URL format if using URL
try {
    new URL(profilePicture);
} catch {
    res.status(400).json({
        message: "Invalid profile picture URL",
        status: Status.failed
    });
    return;
}
```

**For file upload approach:**
```typescript
// multer handles file type and size validation
// Additional validation can be done after upload:
if (!req.file) {
    res.status(400).json({
        message: "Profile picture file is required",
        status: Status.failed
    });
    return;
}
```

### 5. **Storage Strategy**

**Option A: Cloud object storage (recommended for production)**
Staging and production use PostgreSQL. Profile pictures are not currently
backed by an active storage provider; choose an object-storage service before
implementing uploads. The old MongoDB GridFS examples below are not supported
by the current application and should not be used without reintroducing and
reviewing that integration:

```typescript
import { GridFSBucket } from 'mongodb';

// In your database config, you have access to MongoDB
const bucket = new GridFSBucket(mongoDb, {
    bucketName: 'profilePictures'
});

// Store file
const uploadStream = bucket.openUploadStream(`${userId}_profile_picture`, {
    contentType: file.mimetype,
    metadata: {
        userId: userId,
        uploadedAt: new Date()
    }
});

uploadStream.end(file.buffer);
const fileId = uploadStream.id;

// Store file ID in user record
await this.prismaClient.user.update({
    where: { id: userId },
    data: { profilePicture: fileId.toString() }
});
```

**Option B: Cloud Storage (AWS S3, Cloud Storage, etc.)**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `profile-pictures/${userId}`,
    Body: file.buffer,
    ContentType: file.mimetype
});

await s3Client.send(command);

// Store URL in user record
const url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/profile-pictures/${userId}`;
await this.prismaClient.user.update({
    where: { id: userId },
    data: { profilePicture: url }
});
```

**Option C: Base64 Encoding (Not recommended for production)**
```typescript
// Store base64 string directly in database
const base64 = file.buffer.toString('base64');
await this.prismaClient.user.update({
    where: { id: userId },
    data: { profilePicture: base64 }
});
```
⚠️ **Not recommended**: Causes database bloat, poor performance for large files

### 6. **Database Schema**
Check your Prisma schema:
```prisma
model User {
    profilePicture String?  // Nullable initially, set during onboarding
    // ... other fields
}
```

**For MongoDB GridFS:**
Store the GridFS file ID as a string reference in the Prisma User model.

### 7. **Security**
- Must use `authenticate` middleware
- Only the authenticated user can upload their own profile picture
- Use `req.user.userId` from the middleware
- **File upload security:**
  - Validate file type (accept only images)
  - Limit file size (e.g., 5MB max)
  - Sanitize file names
  - Consider virus scanning in production
  - Use secure storage (not public if possible)
  - Implement rate limiting to prevent abuse

### 8. **Image Processing (Optional)**
Consider using libraries to process images:
- **Sharp**: Resize, compress, convert formats
- **Jimp**: Simple image processing
- **Imagemagick**: Advanced image manipulation

Example with Sharp:
```typescript
import sharp from 'sharp';

// Resize and compress
const processedImage = await sharp(file.buffer)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
```

### 9. **Error Handling**
- 401: If not authenticated
- 400: If profile picture already provided, validation fails, or file invalid
- 413: If file too large (when implementing file upload)
- 415: If unsupported file type (when implementing file upload)
- 500: For database or storage errors
- Use `unknown` type for error (not `any`)

### 10. **Response Structure**
```typescript
{
    message: string;
    status: Status.successful;
    user: {
        id: string;
        email: string;
        profilePicture: string;  // URL or file reference
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }
}
```

### 11. **Example Implementation Pattern (File Upload with MongoDB)**

```typescript
import express, { Router, Request, Response } from "express";
import { getPrismaClient } from "../../../../../shared/database/prisma.ts";
import { authenticate } from "../../../../../shared/middleware/auth.middleware.ts";
import Status from "../../../../../shared/types/enums/status.enum.ts";
import multer from 'multer';
import { GridFSBucket } from 'mongodb';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

export default class CollectProfilePicture {
    constructor() { }

    private get router() {
        return express.Router();
    }

    private get prismaClient() {
        return getPrismaClient();
    }

    private _collectProfilePictureRoute(): Router {
        return this.router.post("/collect-profile-picture", authenticate, upload.single('profilePicture'), async (req: Request, res: Response): Promise<void> => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        message: "Authentication required",
                        status: Status.failed
                    });
                    return;
                }

                const file = req.file;

                if (!file) {
                    res.status(400).json({
                        message: "Profile picture file is required",
                        status: Status.failed
                    });
                    return;
                }

                // Check if user already provided profile picture
                const existingUser = await this.prismaClient.user.findUnique({
                    where: { id: req.user.userId }
                });

                if (existingUser?.profilePicture) {
                    res.status(400).json({
                        message: "Profile picture has already been provided",
                        status: Status.failed
                    });
                    return;
                }

                // Get MongoDB connection from AppRegistry
                const registry = AppRegistry.getInstance();
                const databases = registry.getDatabases();
                
                if (!databases.mongo) {
                    res.status(500).json({
                        message: "MongoDB not available for file storage",
                        status: Status.failed
                    });
                    return;
                }

                // Store file in MongoDB GridFS
                const bucket = new GridFSBucket(databases.mongo, {
                    bucketName: 'profilePictures'
                });

                const uploadStream = bucket.openUploadStream(`${req.user.userId}_profile_picture`, {
                    contentType: file.mimetype,
                    metadata: {
                        userId: req.user.userId,
                        uploadedAt: new Date()
                    }
                });

                uploadStream.end(file.buffer);
                const fileId = uploadStream.id;

                // Update user with file ID
                const user = await this.prismaClient.user.update({
                    where: { id: req.user.userId },
                    data: {
                        profilePicture: fileId.toString()
                    }
                });

                const { password: _, ...userWithoutPassword } = user;

                res.status(200).json({
                    message: "Profile picture collected successfully",
                    status: Status.successful,
                    user: userWithoutPassword
                });
            } catch (error: unknown) {
                console.error("Error collecting profile picture:", error);
                res.status(500).json({
                    message: "Failed to collect profile picture",
                    status: Status.failed
                });
            }
        });
    }

    public get collectProfilePictureRoute(): Router {
        return this._collectProfilePictureRoute();
    }
}
```

### 12. **Simplified Implementation (String/URL approach)**

For development or if you want to start simple:

```typescript
interface CollectProfilePictureRequestBody {
    profilePicture: string;
}

export default class CollectProfilePicture {
    // ... (same as above until route method)

    private _collectProfilePictureRoute(): Router {
        return this.router.post("/collect-profile-picture", authenticate, async (req: Request<never, never, CollectProfilePictureRequestBody>, res: Response): Promise<void> => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        message: "Authentication required",
                        status: Status.failed
                    });
                    return;
                }

                const { profilePicture } = req.body;

                if (!profilePicture) {
                    res.status(400).json({
                        message: "Profile picture is required",
                        status: Status.failed
                    });
                    return;
                }

                // Check if user already provided profile picture
                const existingUser = await this.prismaClient.user.findUnique({
                    where: { id: req.user.userId }
                });

                if (existingUser?.profilePicture) {
                    res.status(400).json({
                        message: "Profile picture has already been provided",
                        status: Status.failed
                    });
                    return;
                }

                // Update user with profile picture URL/reference
                const user = await this.prismaClient.user.update({
                    where: { id: req.user.userId },
                    data: {
                        profilePicture
                    }
                });

                const { password: _, ...userWithoutPassword } = user;

                res.status(200).json({
                    message: "Profile picture collected successfully",
                    status: Status.successful,
                    user: userWithoutPassword
                });
            } catch (error: unknown) {
                console.error("Error collecting profile picture:", error);
                res.status(500).json({
                    message: "Failed to collect profile picture",
                    status: Status.failed
                });
            }
        });
    }
}
```

### 13. **Route Registration**
After implementing, register in `src/shared/app/app.ts`:
```typescript
import CollectProfilePicture from "../../features/user/account_details/collect_profile_picture/index.ts";

// In the app() method:
registry.registerRoute("/account-details", new CollectProfilePicture().collectProfilePictureRoute);
```

### 14. **Testing Considerations**
- Test with authenticated user who hasn't provided picture (should succeed)
- Test with authenticated user who has already provided picture (should return 400)
- Test with unauthenticated user (should return 401)
- Test with no file/data (should return 400)
- Test with valid image file (should succeed)
- Test with non-image file (should return 400 for file upload)
- Test with file too large (should return 413 for file upload)
- Test database and storage error scenarios

### 15. **Environment Considerations**

**Development:**
- Can use simple string/URL approach for simplicity
- Or use file system storage temporarily
- MongoDB might not be configured

**Staging/Production:**
- Should use MongoDB GridFS or cloud storage
- Implement proper file upload with multer
- Add image processing
- Implement security measures (virus scanning, etc.)

### 16. **Optional vs Required**
Consider whether profile picture should be:
- **Required**: User must provide it to complete onboarding
- **Optional**: User can skip it and provide later

If optional, allow users to skip and return appropriate response:
```typescript
res.status(200).json({
    message: "Profile picture skipped",
    status: Status.successful,
    user: userWithoutPassword
});
```

---

## Implementation Checklist

**Simple Version (String/URL):**
- [ ] Create `collect_profile_picture.route.ts` with proper imports
- [ ] Define `CollectProfilePictureRequestBody` interface
- [ ] Implement route with POST method
- [ ] Add authentication middleware
- [ ] Add validation (profile picture required or optional)
- [ ] Add check if profile picture already provided
- [ ] Implement Prisma update
- [ ] Add error handling with proper types
- [ ] Create `index.ts` export file
- [ ] Register route in `app.ts`
- [ ] Test with TypeScript compiler

**Full Version (File Upload with MongoDB):**
- [ ] Install multer and MongoDB dependencies
- [ ] Create `collect_profile_picture.route.ts` with proper imports
- [ ] Configure multer with memory storage and validation
- [ ] Implement route with POST method and multer middleware
- [ ] Add authentication middleware
- [ ] Add file validation (type, size)
- [ ] Add check if profile picture already provided
- [ ] Implement MongoDB GridFS storage
- [ ] Implement Prisma update with file ID
- [ ] Add error handling with proper types
- [ ] Create `index.ts` export file
- [ ] Register route in `app.ts`
- [ ] Test with TypeScript compiler
- [ ] Test file upload scenarios

---

## Example Route Path

Full route path after registration:
- `POST /account-details/collect-profile-picture`

---

## Related Routes

- `POST /account-details/collect-name` - Collect name during onboarding
- `POST /account-details/collect-profile-picture` - Collect profile picture during onboarding (this route)
- `PATCH /account-details/update-name` - Update name later (profile management)
- `PATCH /account-details/update-profile-picture` - Update profile picture later (profile management)
