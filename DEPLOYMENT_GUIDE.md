# Deployment Guide - Attack on Titan To-Do List

This guide will walk you through deploying your application with:
- **Backend**: Render (with PostgreSQL)
- **Frontend**: Netlify
- **Database**: PostgreSQL on Render

---

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Render account (sign up at https://render.com)
3. A Netlify account (sign up at https://netlify.com)

---

## Part 1: Deploy Backend on Render

### Step 1: Create PostgreSQL Database

1. Log into your [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure your database:
   - **Name**: `attack-on-titan-db`
   - **Database**: `attack_on_titan`
   - **User**: (auto-generated)
   - **Region**: Choose closest to you (e.g., Oregon)
   - **Plan**: Free
4. Click **"Create Database"**
5. **Important**: Save the **Internal Database URL** (you'll need this)

### Step 2: Deploy Backend Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `attack-on-titan-backend`
   - **Region**: Same as database (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Plan**: Free

4. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable" and add these:

   ```
   FLASK_ENV=production
   DATABASE_URL=[Use the Internal Database URL from Step 1]
   JWT_SECRET_KEY=[Generate using: python -c "import secrets; print(secrets.token_hex(32))"]
   FRONTEND_URL=https://your-app.netlify.app (we'll update this after deploying frontend)
   ```

5. Click **"Create Web Service"**
6. Wait for deployment to complete (5-10 minutes)
7. **Save your backend URL**: `https://attack-on-titan-backend.onrender.com`

### Step 3: Run Database Migrations

After your backend is deployed:

1. Go to your web service in Render
2. Click on the **"Shell"** tab
3. Run these commands:
   ```bash
   cd server
   flask db upgrade
   ```

---

## Part 2: Deploy Frontend on Netlify

### Step 1: Build Configuration

Your repository already has `netlify.toml` configured. Make sure it's in the `client` folder.

### Step 2: Deploy to Netlify

1. Log into [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to your GitHub repository
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Branch**: `main`

5. **Add Environment Variables**:
   Go to **Site settings** → **Environment variables** and add:
   ```
   VITE_API_URL=https://attack-on-titan-backend.onrender.com/api
   VITE_WEBSOCKET_URL=https://attack-on-titan-backend.onrender.com
   ```

6. Click **"Deploy site"**
7. Wait for deployment (2-5 minutes)
8. **Save your frontend URL**: e.g., `https://attack-on-titan-todo.netlify.app`

### Step 3: Update Backend CORS

1. Go back to your Render dashboard
2. Navigate to your backend web service
3. Go to **"Environment"** tab
4. Update the `FRONTEND_URL` variable with your Netlify URL:
   ```
   FRONTEND_URL=https://attack-on-titan-todo.netlify.app
   ```
5. Save and wait for automatic redeployment

---

## Part 3: Verification

### Test Your Deployment

1. Visit your Netlify URL
2. Try to sign up for a new account
3. Create a task
4. Test real-time updates (open in two browser tabs)
5. Check that all features work:
   - Authentication (login/signup)
   - Task CRUD operations
   - Canvas view
   - Calendar view
   - Theme customization

---

## Environment Variables Summary

### Backend (Render)
```env
FLASK_ENV=production
DATABASE_URL=<provided-by-render>
JWT_SECRET_KEY=<generate-secure-key>
FRONTEND_URL=https://your-app.netlify.app
```

### Frontend (Netlify)
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WEBSOCKET_URL=https://your-backend.onrender.com
```

---

## Common Issues & Troubleshooting

### Issue: CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Solution**:
1. Verify `FRONTEND_URL` in Render matches your Netlify URL exactly
2. Make sure both URLs use `https://` (no trailing slash)
3. Redeploy backend after changing environment variables

### Issue: WebSocket Connection Failed

**Symptom**: Real-time updates don't work

**Solution**:
1. Check `VITE_WEBSOCKET_URL` in Netlify environment variables
2. Render's free tier may have cold starts - first connection may take 30-60 seconds
3. WebSocket should fall back to polling automatically

### Issue: Database Connection Error

**Symptom**: Backend crashes or shows database errors

**Solution**:
1. Verify `DATABASE_URL` in Render environment variables
2. Check that database migrations have run: `flask db upgrade`
3. Ensure PostgreSQL instance is running

### Issue: 401 Unauthorized Errors

**Symptom**: Can't login or stay logged in

**Solution**:
1. Verify `JWT_SECRET_KEY` is set in Render
2. Check that `JWT_COOKIE_SECURE` is True in production (app.py)
3. Ensure both frontend and backend use `https://`

### Issue: Build Fails on Netlify

**Symptom**: Netlify build fails during npm install or build

**Solution**:
1. Check `package.json` for correct dependencies
2. Verify `netlify.toml` has correct paths
3. Check build logs for specific error messages
4. Try deploying from a clean branch

---

## Updating Your Deployment

### To Update Backend:
1. Push changes to GitHub
2. Render will automatically redeploy
3. Monitor deployment in Render dashboard

### To Update Frontend:
1. Push changes to GitHub
2. Netlify will automatically redeploy
3. Monitor deployment in Netlify dashboard

### To Update Database Schema:
1. Create new migration locally: `flask db migrate -m "description"`
2. Push migration file to GitHub
3. After backend deploys, run in Render Shell: `flask db upgrade`

---

## Cost Estimates

### Free Tier Limits:
- **Render PostgreSQL**: 1 free database, 90 days (then paid)
- **Render Web Service**: Free (sleeps after 15 min inactivity)
- **Netlify**: 100 GB bandwidth/month, 300 build minutes/month

### Notes:
- Render free tier services "sleep" after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds
- Consider upgrading to paid tier for production apps with real users

---

## Security Checklist

- [ ] `JWT_SECRET_KEY` is a strong, randomly generated secret
- [ ] `DATABASE_URL` is kept secret (never in git)
- [ ] `FRONTEND_URL` in backend matches your Netlify domain exactly
- [ ] All sensitive credentials are in environment variables, not code
- [ ] `.env` files are in `.gitignore` (not committed to git)
- [ ] HTTPS is enabled (automatic on both Render and Netlify)
- [ ] CORS is configured to only allow your frontend domain

---

## Next Steps

1. **Custom Domain** (Optional):
   - Add custom domain in Netlify
   - Update `FRONTEND_URL` in Render accordingly

2. **Monitoring**:
   - Set up Render notification webhooks
   - Enable Netlify deployment notifications

3. **Backups**:
   - Render provides automatic PostgreSQL backups
   - Consider periodic manual backups for critical data

4. **Performance**:
   - Monitor response times in Render logs
   - Check Netlify analytics for frontend performance

---

## Support

If you encounter issues:
1. Check the Render logs (Dashboard → Your Service → Logs)
2. Check Netlify deploy logs (Dashboard → Your Site → Deploys → Deploy log)
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Congratulations! Your Attack on Titan To-Do List is now deployed! 🎉**

