# 🔒 Security Notice - Credentials Removed

## What Happened
Environment files containing sensitive credentials were accidentally committed to the repository.

## Actions Taken (January 7, 2026)

### 1. Removed Sensitive Files from Git
The following files have been removed from version control:
- `apps/api/.env.development`
- `apps/api/.env.production`
- `apps/web/.env.production`
- `apps/web/.env.example` (contained real credentials)

### 2. Updated .gitignore
Enhanced `.gitignore` to prevent future commits of sensitive files:
```gitignore
.env
.env.*
!.env.example
!.env.*.template
```

### 3. Credentials to Rotate

⚠️ **IMPORTANT: The following credentials were exposed and should be rotated immediately:**

#### Supabase Database
- **Database Password:** `[REDACTED - See commit 53ac1d6]`
- **Project Ref:** `[REDACTED]`
- **Anon Key:** Exposed in previous commits
- **Service Role Key:** Exposed in previous commits

**Action Required:**
1. Go to Supabase Dashboard → Settings → Database
2. Reset database password
3. Regenerate API keys (Settings → API)

#### Google API Keys
- **Gemini API Key:** `[REDACTED - See commit 53ac1d6]`
- **Action:** Regenerate at https://console.cloud.google.com/apis/credentials

#### Google OAuth
- **Client ID:** `[REDACTED - See commit 53ac1d6]`
- **Client Secret:** `[REDACTED - See commit 53ac1d6]`
- **Action:** Regenerate at https://console.cloud.google.com/apis/credentials

#### Other API Keys Exposed
- **DeepSeek API:** `[REDACTED - See commit 53ac1d6]`
- **Groq API:** `[REDACTED - See commit 53ac1d6]`

### 4. How to Regenerate Credentials

#### Supabase
```bash
1. Login to https://supabase.com/dashboard
2. Select your project
3. Settings → Database → Reset Database Password
4. Settings → API → Generate New Keys
5. Update your local .env file with new credentials
```

#### Google Cloud (Gemini API & OAuth)
```bash
1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Delete compromised keys/OAuth clients
4. Create new credentials
5. Update your local .env file
```

#### DeepSeek
```bash
1. Go to https://platform.deepseek.com/
2. API Keys → Revoke old key
3. Generate new key
4. Update your local .env file
```

#### Groq
```bash
1. Go to https://console.groq.com/
2. API Keys → Delete exposed key
3. Generate new key
4. Update your local .env file
```

### 5. Setup Local Environment (After Rotating Credentials)

```bash
# API Environment
cd apps/api
cp .env.example .env
# Edit .env with your NEW credentials

# Web Environment
cd apps/web
cp .env.example .env.local
# Edit .env.local with your NEW credentials
```

### 6. Verify .env Files Are Ignored

```bash
# This should show no .env files:
git status

# If .env files appear, they're not being ignored properly
```

## Prevention Measures

### ✅ Implemented
- [x] Updated `.gitignore` with comprehensive .env patterns
- [x] Removed sensitive files from Git tracking
- [x] Created `.env.example` templates without real credentials
- [x] Added security documentation

### 📋 Recommended Actions
- [ ] Rotate all exposed credentials immediately
- [ ] Enable GitHub secret scanning (Settings → Security → Code security and analysis)
- [ ] Set up pre-commit hooks to prevent credential commits
- [ ] Use environment variable management tools (e.g., dotenv-vault, 1Password)
- [ ] Regular security audits of committed files

## Git History Cleanup (Optional)

⚠️ **Warning:** The sensitive data still exists in Git history. To completely remove it:

```bash
# Option 1: Use BFG Repo Cleaner (recommended)
java -jar bfg.jar --delete-files '.env*' --no-blob-protection .
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: Use git filter-branch (slower)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch apps/api/.env.development apps/api/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ coordinate with team)
git push origin --force --all
```

**Note:** Force pushing rewrites history. Coordinate with all team members before doing this.

## Contact

If you discover any security issues, please report them to:
- **Email:** souravdas090300@gmail.com
- **GitHub Issues:** Mark as "security" label

---

**Created:** January 7, 2026  
**Status:** Credentials exposed, rotation required  
**Priority:** 🔴 HIGH
