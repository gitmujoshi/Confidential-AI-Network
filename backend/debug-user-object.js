const express = require('express');
const { authenticateToken } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Debug endpoint to show user object structure
app.get('/debug/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Debug User Object:');
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    console.log('req.user.userId:', req.user.userId);
    console.log('req.user.id:', req.user.id);
    console.log('req.user.localUser:', req.user.localUser);
    console.log('req.user.localUser?.id:', req.user.localUser?.id);
    console.log('req.user.partyType:', req.user.partyType);
    console.log('req.user.authType:', req.user.authType);
    
    const currentUserId = req.user.userId || req.user.id || req.user.localUser?.id;
    console.log('currentUserId:', currentUserId);
    console.log('userId from params:', userId);
    console.log('parseInt(userId):', parseInt(userId));
    console.log('currentUserId !== parseInt(userId):', currentUserId !== parseInt(userId));
    
    res.json({
      user: req.user,
      currentUserId,
      requestedUserId: userId,
      parsedUserId: parseInt(userId),
      isMatch: currentUserId === parseInt(userId),
      isAdmin: req.user.partyType === 'AppAdmin'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug error', details: error.message });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
}); 