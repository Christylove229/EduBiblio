document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated first
  const user = await checkAuth();
  if (!user) return; // User will be redirected by checkAuth if not logged in
  
  // DOM elements
  const documentsGrid = document.getElementById('documents-grid');
  const docsCountElement = document.getElementById('docs-count');
  const loadingSpinner = document.getElementById('loading-spinner');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-input');
  const matiereFilter = document.getElementById('matiere-filter');
  const niveauFilter = document.getElementById('niveau-filter');
  const resetFiltersButton = document.getElementById('reset-filters');
  const clearSearchButton = document.getElementById('clear-search');
  
  // Preview modal elements
  const previewModal = document.getElementById('doc-preview-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMatiere = document.getElementById('modal-matiere');
  const modalNiveau = document.getElementById('modal-niveau');
  const modalPages = document.getElementById('modal-pages');
  const modalPreview = document.getElementById('modal-preview');
  const modalDescription = document.getElementById('modal-description');
  const downloadBtn = document.getElementById('download-btn');
  
  // Store documents data
  let allDocuments = [];
  let filteredDocuments = [];
  
  // Fetch documents from Supabase
  async function fetchDocuments() {
    try {
      loadingSpinner.style.display = 'flex';
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
        documentsGrid.innerHTML = `<p class="error">Erreur lors du chargement des documents: ${error.message}</p>`;
        return;
      }
      
      allDocuments = data || [];
      filteredDocuments = [...allDocuments];
      
      renderDocuments(filteredDocuments);
      
    } catch (error) {
      console.error('Unexpected error fetching documents:', error);
      documentsGrid.innerHTML = `<p class="error">Une erreur inattendue s'est produite. Veuillez rafraîchir la page.</p>`;
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }
  
  // Render documents to the grid
  function renderDocuments(documents) {
    if (!documentsGrid) return;
    
    // Update the count
    if (docsCountElement) {
      docsCountElement.textContent = documents.length;
    }
    
    // Show "no results" message if no documents found
    if (documents.length === 0) {
      documentsGrid.innerHTML = '';
      if (noResults) {
        noResults.style.display = 'block';
      }
      return;
    }
    
    // Hide "no results" message
    if (noResults) {
      noResults.style.display = 'none';
    }
    
    // Generate HTML for the documents
    let html = '';
    
    documents.forEach(doc => {
      html += `
        <div class="document-card" data-id="${doc.id}">
          <div class="document-thumbnail">
            <img src="${doc.thumbnail_url || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'}" alt="${doc.titre}">
            <span class="document-type">PDF</span>
          </div>
          <div class="document-info">
            <h3 class="document-title">${doc.titre}</h3>
            <div class="document-meta">
              <span class="document-matiere">${doc.matiere}</span>
              <span class="document-niveau">${doc.niveau}</span>
            </div>
            <p class="document-description">${doc.description.substring(0, 100)}${doc.description.length > 100 ? '...' : ''}</p>
          </div>
          <div class="document-footer">
            <span class="document-badge">${doc.pages} pages</span>
            <button class="btn btn-primary btn-small preview-btn" data-id="${doc.id}">Aperçu</button>
          </div>
        </div>
      `;
    });
    
    documentsGrid.innerHTML = html;
    
    // Add event listeners to preview buttons
    const previewButtons = document.querySelectorAll('.preview-btn');
    previewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const docId = button.getAttribute('data-id');
        openDocumentPreview(docId);
      });
    });
    
    // Add event listeners to document cards
    const documentCards = document.querySelectorAll('.document-card');
    documentCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Only trigger if the click was not on the preview button
        if (!e.target.closest('.preview-btn')) {
          const docId = card.getAttribute('data-id');
          openDocumentPreview(docId);
        }
      });
    });
  }
  
  // Open document preview modal
  function openDocumentPreview(docId) {
    const document = allDocuments.find(doc => doc.id === docId);
    
    if (!document || !previewModal) return;
    
    // Populate modal with document data
    modalTitle.textContent = document.titre;
    modalMatiere.textContent = document.matiere;
    modalNiveau.textContent = document.niveau;
    modalPages.textContent = document.pages;
    modalDescription.textContent = document.description;
    modalPreview.src = document.preview_url || document.thumbnail_url || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    
    // Set download button link
    downloadBtn.href = document.file_url;
    downloadBtn.setAttribute('download', document.titre + '.pdf');
    
    // Add click event to download button to track download
    downloadBtn.onclick = async () => {
      try {
        // Record download in the user_downloads table
        await supabase.from('user_downloads').insert({
          user_id: user.id,
          document_id: docId,
          downloaded_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error recording download:', error);
      }
    };
    
    // Show the modal
    previewModal.classList.add('active');
  }
  
  // Filter documents based on search input and filters
  function filterDocuments() {
    const searchTerm = searchInput.value.toLowerCase();
    const matiereValue = matiereFilter.value;
    const niveauValue = niveauFilter.value;
    
    filteredDocuments = allDocuments.filter(doc => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        doc.titre.toLowerCase().includes(searchTerm) ||
        doc.description.toLowerCase().includes(searchTerm);
      
      // Matiere filter
      const matchesMatiere = !matiereValue || doc.matiere.toLowerCase() === matiereValue;
      
      // Niveau filter
      const matchesNiveau = !niveauValue || doc.niveau.toLowerCase() === niveauValue;
      
      return matchesSearch && matchesMatiere && matchesNiveau;
    });
    
    renderDocuments(filteredDocuments);
  }
  
  // Event listeners for search and filters
  if (searchInput) {
    searchInput.addEventListener('input', filterDocuments);
  }
  
  if (matiereFilter) {
    matiereFilter.addEventListener('change', filterDocuments);
  }
  
  if (niveauFilter) {
    niveauFilter.addEventListener('change', filterDocuments);
  }
  
  // Reset filters button
  if (resetFiltersButton) {
    resetFiltersButton.addEventListener('click', () => {
      searchInput.value = '';
      matiereFilter.value = '';
      niveauFilter.value = '';
      filteredDocuments = [...allDocuments];
      renderDocuments(filteredDocuments);
    });
  }
  
  // Clear search button
  if (clearSearchButton) {
    clearSearchButton.addEventListener('click', () => {
      searchInput.value = '';
      filterDocuments();
    });
  }
  
  // Fetch documents on page load
  fetchDocuments();
  
  // Add some sample data if the table is empty (development only)
  async function addSampleData() {
    const { data, error } = await supabase.from('documents').select('id');
    
    if (error) {
      console.error('Error checking documents:', error);
      return;
    }
    
    // If no documents exist, add sample data
    if (data.length === 0) {
      const sampleDocuments = [
        {
          titre: 'Baccalauréat de Mathématiques 2023',
          matiere: 'Mathematiques',
          niveau: 'Terminale',
          description: 'Épreuve du baccalauréat de mathématiques pour la filière scientifique. Ce document contient l\'ensemble des exercices avec leurs corrigés détaillés.',
          pages: 12,
          thumbnail_url: 'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          file_url: 'https://example.com/path/to/document.pdf'
        },
        {
          titre: 'Examen de Physique - Première',
          matiere: 'Physique',
          niveau: 'Premiere',
          description: 'Préparation à l\'examen de physique pour les élèves de première. Inclut des problèmes sur la mécanique, l\'électricité et l\'optique.',
          pages: 8,
          thumbnail_url: 'https://images.pexels.com/photos/8321370/pexels-photo-8321370.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          file_url: 'https://example.com/path/to/document.pdf'
        },
        {
          titre: 'Brevet des Collèges - Histoire-Géographie',
          matiere: 'Histoire',
          niveau: 'College',
          description: 'Annales du brevet des collèges en histoire-géographie. Document contenant les sujets des années précédentes avec leurs corrigés.',
          pages: 15,
          thumbnail_url: 'https://images.pexels.com/photos/1428277/pexels-photo-1428277.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          file_url: 'https://example.com/path/to/document.pdf'
        },
        {
          titre: 'Philosophie - Dissertation méthodologie',
          matiere: 'Philosophie',
          niveau: 'Terminale',
          description: 'Guide méthodologique pour la dissertation en philosophie. Contient des exemples et des conseils pour préparer l\'épreuve du baccalauréat.',
          pages: 10,
          thumbnail_url: 'https://images.pexels.com/photos/6335/man-coffee-cup-pen.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          file_url: 'https://example.com/path/to/document.pdf'
        },
        {
          titre: 'Épreuve d\'Anglais B2 - Compréhension',
          matiere: 'Anglais',
          niveau: 'Lycee',
          description: 'Épreuve de compréhension écrite et orale pour le niveau B2 en anglais. Contient des textes, des exercices et les corrigés.',
          pages: 7,
          thumbnail_url: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          file_url: 'https://example.com/path/to/document.pdf'
        },
        {
          titre: 'SVT - Écosystèmes et Environnement',
          matiere: 'SVT',
          niveau: 'Premiere',
          description: 'Cours complet et exercices sur les écosystèmes et l\'environnement pour les élèves de première. Comprend des schémas explicatifs et des études de cas.',
          pages: 14,
          thumbnail_url: 'https://images.pexels.com/photos/2265247/pexels-photo-2265247.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
          file_url: 'https://example.com/path/to/document.pdf'
        }
      ];
      
      // Insert sample documents
      const { error: insertError } = await supabase.from('documents').insert(sampleDocuments);
      
      if (insertError) {
        console.error('Error inserting sample data:', insertError);
      } else {
        console.log('Sample documents added successfully');
        // Reload the page to show the sample data
        window.location.reload();
      }
    }
  }
  
  // Uncomment to add sample data in development
  // addSampleData();
});