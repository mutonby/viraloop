#!/usr/bin/env node
/**
 * Learn from Analytics - Accumulates insights across all posts
 * 
 * Run daily after checking analytics to build your knowledge base.
 * The more posts, the smarter the recommendations.
 */

const fs = require('fs');
const path = require('path');

const CAROUSEL_DIR = '/tmp/carousel';
const SKILL_DIR = path.dirname(__dirname);
const LEARNINGS_FILE = path.join(SKILL_DIR, 'learnings.json');

function loadLearnings() {
  try {
    return JSON.parse(fs.readFileSync(LEARNINGS_FILE, 'utf8'));
  } catch (e) {
    return {
      version: 2,
      created: new Date().toISOString(),
      totalPosts: 0,
      posts: [],
      insights: {
        bestHooks: [],
        bestPrompts: [],
        bestTimes: [],
        bestDays: [],
        avgViews: 0,
        avgLikes: 0,
        avgEngagement: 0,
        topPerformers: [],
        lowPerformers: []
      },
      recommendations: [],
      history: []
    };
  }
}

function saveLearnings(data) {
  data.updated = new Date().toISOString();
  fs.writeFileSync(LEARNINGS_FILE, JSON.stringify(data, null, 2));
}

function extractHook(title) {
  if (!title) return null;
  const firstLine = title.split('\n')[0].trim();
  return firstLine.length < 100 ? firstLine : firstLine.substring(0, 100) + '...';
}

function calculateEngagement(views, likes, comments, shares) {
  if (!views || views === 0) return 0;
  return ((likes + comments * 2 + shares * 3) / views * 100).toFixed(2);
}

function analyzePost(post, learnings, prompts = []) {
  const views = post.views || post.metrics?.views || 0;
  const likes = post.likes || post.metrics?.likes || 0;
  const comments = post.comments || post.metrics?.comments || 0;
  const shares = post.shares || post.metrics?.shares || 0;
  const engagement = calculateEngagement(views, likes, comments, shares);
  
  const avgViews = learnings.insights.avgViews || views;
  
  return {
    id: post.request_id || post.id || Date.now().toString(),
    hook: extractHook(post.title || post.caption),
    prompts: prompts,
    platform: post.platform || 'tiktok',
    date: post.date || post.timestamp || new Date().toISOString(),
    hour: new Date(post.date || post.timestamp || Date.now()).getHours(),
    dayOfWeek: new Date(post.date || post.timestamp || Date.now()).getDay(),
    views,
    likes,
    comments,
    shares,
    engagement: parseFloat(engagement),
    performance: views > avgViews * 1.5 ? 'top' : views < avgViews * 0.5 ? 'low' : 'average'
  };
}

function updateInsights(learnings) {
  const posts = learnings.posts;
  if (posts.length === 0) return;
  
  // Calculate averages
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalEngagement = posts.reduce((sum, p) => sum + (p.engagement || 0), 0);
  
  learnings.insights.avgViews = Math.round(totalViews / posts.length);
  learnings.insights.avgLikes = Math.round(totalLikes / posts.length);
  learnings.insights.avgEngagement = (totalEngagement / posts.length).toFixed(2);
  
  // Find top performers
  const sortedByViews = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0));
  learnings.insights.topPerformers = sortedByViews.slice(0, 5).map(p => ({
    hook: p.hook,
    views: p.views,
    engagement: p.engagement
  }));
  
  // Find low performers
  learnings.insights.lowPerformers = sortedByViews.slice(-3).map(p => ({
    hook: p.hook,
    views: p.views,
    reason: 'Low views'
  }));
  
  // Best hooks (from top performers)
  learnings.insights.bestHooks = learnings.insights.topPerformers
    .map(p => p.hook)
    .filter(h => h);
    
  // Best prompts (extract style from slide 1 of top performers)
  learnings.insights.bestPrompts = sortedByViews
    .slice(0, 3)
    .filter(p => p.prompts && p.prompts.length > 0)
    .map(p => {
      const slide1 = p.prompts.find(pr => Number(pr.slide) === 1);
      return slide1 ? slide1.prompt : null;
    })
    .filter(p => p);
  
  // Best posting times
  const hourCounts = {};
  const hourViews = {};
  posts.forEach(p => {
    const hour = p.hour;
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    hourViews[hour] = (hourViews[hour] || 0) + (p.views || 0);
  });
  
  const avgViewsByHour = Object.entries(hourViews).map(([hour, views]) => ({
    hour: parseInt(hour),
    avgViews: Math.round(views / (hourCounts[hour] || 1))
  })).sort((a, b) => b.avgViews - a.avgViews);
  
  learnings.insights.bestTimes = avgViewsByHour.slice(0, 3).map(h => `${h.hour}:00`);
  
  // Best days
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = {};
  const dayViews = {};
  posts.forEach(p => {
    const day = p.dayOfWeek;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    dayViews[day] = (dayViews[day] || 0) + (p.views || 0);
  });
  
  const avgViewsByDay = Object.entries(dayViews).map(([day, views]) => ({
    day: dayNames[parseInt(day)],
    avgViews: Math.round(views / (dayCounts[day] || 1))
  })).sort((a, b) => b.avgViews - a.avgViews);
  
  learnings.insights.bestDays = avgViewsByDay.slice(0, 3).map(d => d.day);
  
  // Generate recommendations
  learnings.recommendations = [];
  
  if (learnings.insights.bestHooks.length > 0) {
    learnings.recommendations.push({
      type: 'hook',
      priority: 'high',
      message: `Use hooks similar to: "${learnings.insights.bestHooks[0]}"`
    });
  }
  
  if (learnings.insights.bestPrompts.length > 0) {
    learnings.recommendations.push({
      type: 'prompt',
      priority: 'high',
      message: 'Reuse the visual style (colors/lighting) from your top performing prompt.'
    });
  }
  
  if (learnings.insights.bestTimes.length > 0) {
    learnings.recommendations.push({
      type: 'timing',
      priority: 'medium',
      message: `Best posting times: ${learnings.insights.bestTimes.join(', ')}`
    });
  }
  
  if (learnings.insights.bestDays.length > 0) {
    learnings.recommendations.push({
      type: 'day',
      priority: 'medium',
      message: `Best days: ${learnings.insights.bestDays.join(', ')}`
    });
  }
  
  if (posts.length < 10) {
    learnings.recommendations.push({
      type: 'data',
      priority: 'info',
      message: `Keep posting! ${10 - posts.length} more posts needed for reliable insights.`
    });
  }
  
  if (posts.length >= 10 && learnings.insights.avgEngagement < 5) {
    learnings.recommendations.push({
      type: 'engagement',
      priority: 'high',
      message: 'Engagement is low. Try more provocative hooks or trending audio.'
    });
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧠 LEARNING FROM ANALYTICS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const learnings = loadLearnings();
  
  // Load latest analytics snapshot
  const snapshotFile = path.join(CAROUSEL_DIR, 'analytics-snapshot.json');
  let snapshot = {};
  try {
    snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  } catch (e) {
    console.log('⚠️  No analytics snapshot found. Run check-analytics.sh first.\n');
  }
  
  // Load post info if exists
  const postInfoFile = path.join(CAROUSEL_DIR, 'post-info.json');
  let postInfo = {};
  try {
    postInfo = JSON.parse(fs.readFileSync(postInfoFile, 'utf8'));
  } catch (e) {
    // No post info
  }
  
  // Add new post if not already tracked
  if (postInfo.request_id) {
    const exists = learnings.posts.find(p => p.id === postInfo.request_id);
    if (!exists) {
      // Load prompts if they exist
      const promptsFile = path.join(CAROUSEL_DIR, 'slide-prompts.json');
      let slidePrompts = [];
      try {
        slidePrompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
      } catch (e) {
        // No prompts
      }

      // Get metrics from snapshot if available
      const metrics = snapshot.profile?.tiktok || {};
      const newPost = analyzePost({
        request_id: postInfo.request_id,
        title: postInfo.caption,
        platform: 'tiktok',
        timestamp: postInfo.timestamp,
        views: metrics.impressions || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0
      }, learnings, slidePrompts);
      
      learnings.posts.push(newPost);
      learnings.totalPosts = learnings.posts.length;
      console.log(`📝 New post added: ${newPost.hook?.substring(0, 40)}...`);
    }
  }
  
  // Keep only last 100 posts
  learnings.posts = learnings.posts.slice(-100);
  
  // Update insights
  updateInsights(learnings);
  
  // Add to history
  learnings.history.push({
    date: new Date().toISOString(),
    totalPosts: learnings.totalPosts,
    avgViews: learnings.insights.avgViews,
    avgEngagement: learnings.insights.avgEngagement
  });
  learnings.history = learnings.history.slice(-30); // Keep 30 days
  
  // Save
  saveLearnings(learnings);
  
  // Display results
  console.log(`📊 Total posts tracked: ${learnings.totalPosts}`);
  console.log(`👀 Average views: ${learnings.insights.avgViews}`);
  console.log(`❤️  Average likes: ${learnings.insights.avgLikes}`);
  console.log(`📈 Average engagement: ${learnings.insights.avgEngagement}%`);
  
  if (learnings.insights.bestHooks.length > 0) {
    console.log('\n🏆 Best performing hooks:');
    learnings.insights.bestHooks.slice(0, 3).forEach((h, i) => {
      console.log(`   ${i + 1}. "${h}"`);
    });
  }
  
  if (learnings.insights.bestTimes.length > 0) {
    console.log(`\n⏰ Best posting times: ${learnings.insights.bestTimes.join(', ')}`);
  }
  
  if (learnings.insights.bestDays.length > 0) {
    console.log(`📅 Best days: ${learnings.insights.bestDays.join(', ')}`);
  }
  
  if (learnings.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    learnings.recommendations.forEach(r => {
      const icon = r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : 'ℹ️';
      console.log(`   ${icon} ${r.message}`);
    });
  }
  
  console.log(`\n💾 Learnings saved to: ${LEARNINGS_FILE}`);
  console.log('\n═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
