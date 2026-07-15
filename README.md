# Cloud Drive

A personal cloud storage application built with Next.js 15, TypeScript, and AWS S3. No database required — all metadata is stored as JSON in S3.

## Features

- File upload/download with presigned S3 URLs
- Folder management (nested, rename, delete)
- Markdown notes with autosave and preview
- Favorites, Recent, Trash
- Full-text search across files, folders, and notes
- Dark/light/system theme
- JWT authentication with HTTP-only cookies
- Context menus, image/PDF preview

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- AWS SDK v3
- bcryptjs + jsonwebtoken
- react-hook-form + zod
- next-themes + sonner

## Project Structure

```
app/
  (dashboard)/        # Protected routes (sidebar layout)
    page.tsx          # Home / root folder
    folder/[id]/      # Folder view
    notes/[id]/       # Note editor
    favorites/        # Starred items
    recent/           # Recently modified
    search/           # Search results
    trash/            # Trashed items
    settings/         # Theme & app info
  api/
    auth/             # Login + logout
    folders/          # CRUD folders
    files/            # CRUD files + upload
    notes/            # CRUD notes
    search/           # In-memory search
    trash/            # List + empty trash
  login/              # Login page
services/
  s3.ts               # All AWS SDK usage (isolated here)
repositories/
  folder.repository.ts
  file.repository.ts
  note.repository.ts
types/
  index.ts
lib/
  auth.ts             # JWT + bcrypt helpers
utils/
  nanoid.ts           # ID generator
components/
  drive/              # Drive UI components
  ui/                 # shadcn/ui components
middleware.ts         # Route protection
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in values:

```bash
cp .env.local .env.local
```

Generate a bcrypt password hash:

```bash
node -e "require('bcryptjs').hash('yourpassword', 12).then(console.log)"
```

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. AWS S3 Setup

Create an S3 bucket and attach this IAM policy to your user/role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:CopyObject",
        "s3:ListBucket",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

Enable CORS on the bucket for presigned upload URLs:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

### 4. Run locally

```bash
npm run dev
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

## Environment Variables

| Variable | Description |
|---|---|
| `APP_USERNAME` | Login username |
| `APP_PASSWORD_HASH` | bcrypt hash of password |
| `JWT_SECRET` | Random secret for JWT signing |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | S3 bucket region |
| `AWS_BUCKET_NAME` | S3 bucket name |

## S3 Storage Layout

```
metadata/
  folders.json
  files.json
  notes.json
uploads/
  images/
  videos/
  audio/
  documents/
notes/
  <id>.md
```

## Migrating to a Database

The repository layer (`repositories/`) is the only place that reads/writes S3 JSON. To migrate to a database, replace the repository implementations — no other code changes needed.
