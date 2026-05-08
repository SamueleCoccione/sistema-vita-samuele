{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // /api/strava.js\
export default async function handler(req, res) \{\
\
  // Step 1: rinnova l'access token\
  const tokenRes = await fetch('https://www.strava.com/oauth/token', \{\
    method: 'POST',\
    headers: \{ 'Content-Type': 'application/json' \},\
    body: JSON.stringify(\{\
      client_id:     process.env.STRAVA_CLIENT_ID,\
      client_secret: process.env.STRAVA_CLIENT_SECRET,\
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,\
      grant_type:    'refresh_token',\
    \}),\
  \});\
\
  const \{ access_token \} = await tokenRes.json();\
\
  // Step 2: fetch attivit\'e0\
  const \{ per_page = 30, page = 1 \} = req.query;\
  const activitiesRes = await fetch(\
    `https://www.strava.com/api/v3/athlete/activities?per_page=$\{per_page\}&page=$\{page\}`,\
    \{ headers: \{ Authorization: `Bearer $\{access_token\}` \} \}\
  );\
\
  const activities = await activitiesRes.json();\
  res.status(200).json(activities);\
\}}