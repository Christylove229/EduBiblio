// Initialize Supabase client
const SUPABASE_URL = 'https://glyipynsnsrnhcypgffv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdseWlweW5zbnNybmhjeXBnZmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjI3MTksImV4cCI6MjA2MjczODcxOX0.eSdeDnzJmilfQqA0SWSpe-1wXBu8Hp4QlORKfgFb5bU';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Handle authentication
async function checkAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking auth status:', error.message);
      return null;
    }
    
    if (!session) {
      // Not logged in, redirect to login page if on a protected page
      const currentPath = window.location.pathname;
      const protectedPages = ['/library.html', '/profile.html'];
      
      if (protectedPages.some(page => currentPath.endsWith(page))) {
        window.location.href = 'login.html';
      }
      
      return null;
    }
    
    // User is logged in
    const user = session.user;
    updateUIForLoggedInUser(user);
    
    // Redirect to library if on login or register page
    const currentPath = window.location.pathname;
    const authPages = ['/login.html', '/register.html'];
    
    if (authPages.some(page => currentPath.endsWith(page))) {
      window.location.href = 'library.html';
    }
    
    return user;
  } catch (error) {
    console.error('Error in auth check:', error.message);
    return null;
  }
}

// Update UI elements for logged in user
function updateUIForLoggedInUser(user) {
  // Update navigation
  const authButtons = document.querySelector('.auth-buttons');
  const userMenu = document.querySelector('.user-menu');
  
  if (authButtons && userMenu) {
    authButtons.style.display = 'none';
    userMenu.style.display = 'block';
  }
  
  // Set user info
  const userNameElement = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');
  const profileAvatar = document.getElementById('profile-avatar');
  
  if (userNameElement) {
    // Try to get user's display name from metadata or use email
    const displayName = user.user_metadata?.name || user.email.split('@')[0];
    userNameElement.textContent = displayName;
  }
  
  if (userAvatar) {
    // Set user avatar (this could be customized if users have profile pictures)
    const userInitial = (user.email.charAt(0) || 'U').toUpperCase();
    userAvatar.src = `https://ui-avatars.com/api/?name=${userInitial}&background=1E40AF&color=fff`;
  }
  
  if (profileAvatar) {
    const userInitial = (user.email.charAt(0) || 'U').toUpperCase();
    profileAvatar.src = `https://ui-avatars.com/api/?name=${userInitial}&background=1E40AF&color=fff&size=200`;
  }
  
  // Set logout button handler
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
    });
  }
}

// Logout function
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error.message);
      return;
    }
    
    // Redirect to home page
    window.location.href = 'index.html';
    
  } catch (error) {
    console.error('Error during logout:', error.message);
  }
}

// Check password strength
function checkPasswordStrength(password) {
  // Return a score from 0-4 based on password strength
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score++; // Has uppercase
  if (/[a-z]/.test(password)) score++; // Has lowercase
  if (/[0-9]/.test(password)) score++; // Has number
  if (/[^A-Za-z0-9]/.test(password)) score++; // Has special character
  
  return score;
}

// Update password strength indicator
function updatePasswordStrength(password, strengthIndicator, strengthText) {
  if (!strengthIndicator || !strengthText) return;
  
  const score = checkPasswordStrength(password);
  let width = '0%';
  let color = '';
  let text = '';
  
  switch (score) {
    case 0:
      width = '0%';
      color = '#EF4444'; // Red
      text = 'Très faible';
      break;
    case 1:
      width = '25%';
      color = '#EF4444'; // Red
      text = 'Faible';
      break;
    case 2:
      width = '50%';
      color = '#F97316'; // Orange
      text = 'Moyen';
      break;
    case 3:
      width = '75%';
      color = '#F59E0B'; // Amber
      text = 'Bon';
      break;
    case 4:
    case 5:
      width = '100%';
      color = '#10B981'; // Green
      text = 'Excellent';
      break;
  }
  
  strengthIndicator.style.width = width;
  strengthIndicator.style.backgroundColor = color;
  strengthText.textContent = `Force du mot de passe: ${text}`;
}

// Run authentication check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});