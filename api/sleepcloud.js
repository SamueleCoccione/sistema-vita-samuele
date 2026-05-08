{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // /api/sleepcloud.js\
export default async function handler(req, res) \{\
  const \{ user_token, timestamp = 0 \} = req.query;\
\
  if (!user_token) \{\
    return res.status(400).json(\{ error: 'user_token mancante' \});\
  \}\
\
  try \{\
    const url = `https://sleep-cloud.appspot.com/fetchRecords?timestamp=$\{timestamp\}&user_token=$\{encodeURIComponent(user_token)\}`;\
    const response = await fetch(url);\
    const text = await response.text();\
\
    res.setHeader('Content-Type', 'application/json');\
    res.status(response.status).send(text);\
  \} catch (err) \{\
    res.status(500).json(\{ error: err.message \});\
  \}\
\}}