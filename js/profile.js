document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated first
  const user = await checkAuth();
  if (!user) return; // User will be redirected by checkAuth if not logged in
  
  // DOM Elements
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileForm = document.getElementById('profile-form');
  const displayNameInput = document.getElementById('display-name');
  const profileEmailInput = document.getElementById('profile-email-input');
  const joinedDateInput = document.getElementById('joined-date');
  const passwordForm = document.getElementById('password-form');
  const newPasswordInput = document.getElementById('new-password');
  const confirmNewPasswordInput = document.getElementById('confirm-new-password');
  const passwordStrength = document.getElementById('password-strength');
  const strengthText = document.getElementById('strength-text');
  const deleteAccount = document.getElementById('delete-account');
  const deleteModal = document.getElementById('delete-modal');
  const cancelDelete = document.getElementById('cancel-delete');
  const confirmDelete = document.getElementById('confirm-delete');
  const deleteConfirmInput = document.getElementById('delete-confirm');
  const downloadsContainer = document.getElementById('downloads-container');
  const downloadsLoading = document.getElementById('downloads-loading');
  const downloadsList = document.getElementById('downloads-list');
  const noDownloads = document.getElementById('no-downloads');
  
  // Tab navigation
  const tabLinks = document.querySelectorAll('.profile-menu a');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs
      tabLinks.forEach(l => l.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');
      
      // Add active class to clicked tab
      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(tabId).style.display = 'block';
      
      // Load downloads if that tab is selected
      if (tabId === 'recent-downloads') {
        loadRecentDownloads();
      }
    });
  });
  
  // Load user profile data
  function loadUserProfile() {
    if (!user) return;
    
    // Set profile name from user metadata or email
    const displayName = user.user_metadata?.name || user.email.split('@')[0];
    if (profileName) profileName.textContent = displayName;
    if (displayNameInput) displayNameInput.value = displayName;
    
    // Set email
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileEmailInput) profileEmailInput.value = user.email;
    
    // Set joined date
    if (joinedDateInput) {
      const joinedDate = user.user_metadata?.joined || user.created_at;
      joinedDateInput.value = formatDate(joinedDate);
    }
  }
  
  // Load recent downloads
  async function loadRecentDownloads() {
    if (!downloadsContainer || !downloadsList || !noDownloads || !downloadsLoading) return;
    
    try {
      // Show loading spinner
      downloadsLoading.style.display = 'flex';
      downloadsList.style.display = 'none';
      noDownloads.style.display = 'none';
      
      // Fetch user's downloads
      const { data, error } = await supabase
        .from('user_downloads')
        .select(`
          id,
          downloaded_at,
          documents (
            id,
            titre,
            matiere,
            niveau,
            file_url
          )
        `)
        .eq('user_id', user.id)
        .order('downloaded_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching downloads:', error);
        return;
      }
      
      // Hide loading spinner
      downloadsLoading.style.display = 'none';
      
      // Show "no downloads" message if no data
      if (!data || data.length === 0) {
        noDownloads.style.display = 'block';
        return;
      }
      
      // Show downloads list
      downloadsList.style.display = 'block';
      
      // Generate HTML for downloads
      let html = '';
      
      data.forEach(download => {
        const doc = download.documents;
        
        html += `
          <li class="download-item">
            <div class="download-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
            </div>
            <div class="download-details">
              <h4 class="download-title">${doc.titre}</h4>
              <div class="download-meta">
                <span>${doc.matiere} - ${doc.niveau}</span>
                <span>${formatDate(download.downloaded_at)}</span>
              </div>
            </div>
            <div class="download-actions">
              <a href="${doc.file_url}" download title="Télécharger à nouveau">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
              </a>
            </div>
          </li>
        `;
      });
      
      downloadsList.innerHTML = html;
      
    } catch (error) {
      console.error('Unexpected error loading downloads:', error);
      downloadsLoading.style.display = 'none';
    }
  }
  
  // Handle profile form submission
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const displayName = displayNameInput.value.trim();
      
      if (!displayName) {
        showError('error-message', 'Veuillez entrer un nom d\'affichage.');
        return;
      }
      
      try {
        // Update user metadata
        const { error } = await supabase.auth.updateUser({
          data: { name: displayName }
        });
        
        if (error) {
          console.error('Error updating profile:', error);
          showError('error-message', error.message || 'Erreur lors de la mise à jour du profil.');
          return;
        }
        
        // Update UI
        if (profileName) profileName.textContent = displayName;
        
        // Show success message
        showSuccess('success-message', 'Profil mis à jour avec succès.');
        
      } catch (error) {
        console.error('Unexpected error updating profile:', error);
        showError('error-message', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    });
  }
  
  // Update password strength indicator in real-time
  if (newPasswordInput && passwordStrength && strengthText) {
    newPasswordInput.addEventListener('input', () => {
      updatePasswordStrength(newPasswordInput.value, passwordStrength, strengthText);
    });
  }
  
  // Handle password form submission
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = newPasswordInput.value;
      const confirmNewPassword = confirmNewPasswordInput.value;
      
      // Form validation
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        showError('password-error-message', 'Veuillez remplir tous les champs.');
        return;
      }
      
      if (newPassword !== confirmNewPassword) {
        showError('password-error-message', 'Les nouveaux mots de passe ne correspondent pas.');
        return;
      }
      
      if (newPassword.length < 6) {
        showError('password-error-message', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      
      if (checkPasswordStrength(newPassword) < 3) {
        showError('password-error-message', 'Le nouveau mot de passe n\'est pas assez fort. Utilisez des lettres, des chiffres et des caractères spéciaux.');
        return;
      }
      
      try {
        // First, verify the current password by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });
        
        if (signInError) {
          console.error('Error verifying current password:', signInError);
          showError('password-error-message', 'Le mot de passe actuel est incorrect.');
          return;
        }
        
        // Then update the password
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) {
          console.error('Error updating password:', error);
          showError('password-error-message', error.message || 'Erreur lors de la mise à jour du mot de passe.');
          return;
        }
        
        // Reset form
        passwordForm.reset();
        
        // Show success message
        showSuccess('password-success-message', 'Mot de passe mis à jour avec succès.');
        
      } catch (error) {
        console.error('Unexpected error updating password:', error);
        showError('password-error-message', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    });
  }
  
  // Delete account confirmation modal
  if (deleteAccount && deleteModal) {
    deleteAccount.addEventListener('click', () => {
      deleteModal.classList.add('active');
    });
  }
  
  if (cancelDelete) {
    cancelDelete.addEventListener('click', () => {
      deleteModal.classList.remove('active');
      deleteConfirmInput.value = '';
      confirmDelete.disabled = true;
    });
  }
  
  // Enable/disable confirm delete button based on input
  if (deleteConfirmInput && confirmDelete) {
    deleteConfirmInput.addEventListener('input', () => {
      confirmDelete.disabled = deleteConfirmInput.value !== 'SUPPRIMER';
    });
  }
  
  // Handle account deletion
  if (confirmDelete) {
    confirmDelete.addEventListener('click', async () => {
      if (deleteConfirmInput.value !== 'SUPPRIMER') return;
      
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error('Error deleting account:', error);
          showError('error-message', error.message || 'Erreur lors de la suppression du compte.');
          deleteModal.classList.remove('active');
          return;
        }
        
        // Account deleted successfully, sign out and redirect to home
        await supabase.auth.signOut();
        window.location.href = 'index.html';
        
      } catch (error) {
        console.error('Unexpected error deleting account:', error);
        showError('error-message', 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
        deleteModal.classList.remove('active');
      }
    });
  }
  
  // Load user data on page load
  loadUserProfile();
});