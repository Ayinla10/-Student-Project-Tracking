(function () {
  const state = {
    page: 1,
    pageSize: 10,
    search: '',
    supervisor: '',
    status: '',
    sortBy: 'created_at',
    sortDir: 'desc',
  };

  const summaryGrid = document.getElementById('summaryGrid');
  const studentsBody = document.getElementById('studentsBody');
  const pagination = document.getElementById('pagination');
  const searchInput = document.getElementById('searchInput');
  const supervisorFilter = document.getElementById('supervisorFilter');
  const statusFilter = document.getElementById('statusFilter');
  const exportBtn = document.getElementById('exportBtn');

  const SUMMARY_LABELS = ['Total', 'Proposal', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Completed'];
  const SUMMARY_KEYS = ['total', 'Proposal', 'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Completed'];

  function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function renderSummary(summary) {
    summaryGrid.innerHTML = SUMMARY_KEYS.map((key, i) => `
      <div class="summary-card">
        <div class="value">${summary[key] || 0}</div>
        <div class="label">${SUMMARY_LABELS[i]}</div>
      </div>
    `).join('');
  }

  function renderSupervisorOptions(supervisors) {
    const current = supervisorFilter.value;
    supervisorFilter.innerHTML = '<option value="">All supervisors</option>' +
      supervisors.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    supervisorFilter.value = current;
  }

  function renderTable(students) {
    if (!students.length) {
      studentsBody.innerHTML = '<tr><td colspan="7">No students found.</td></tr>';
      return;
    }
    studentsBody.innerHTML = students.map((s) => `
      <tr>
        <td>${escapeHtml(s.rollNumber)}</td>
        <td>${escapeHtml(s.fullName)}</td>
        <td>${escapeHtml(s.supervisor)}</td>
        <td><span class="badge ${s.status === 'Completed' ? 'completed' : ''}">${escapeHtml(s.status)}</span></td>
        <td>${new Date(s.createdAt).toLocaleString()}</td>
        <td>${new Date(s.updatedAt).toLocaleString()}</td>
        <td>
          <button class="btn btn-small edit-btn" data-id="${s.id}">Edit</button>
          <button class="btn btn-small btn-danger delete-btn" data-id="${s.id}" data-name="${escapeHtml(s.fullName)}">Delete</button>
        </td>
      </tr>
    `).join('');

    studentsBody.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => openEditModal(students.find((s) => String(s.id) === btn.dataset.id)));
    });
    studentsBody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  }

  function renderPagination(page, totalPages) {
    pagination.innerHTML = `
      <button id="prevPage" ${page <= 1 ? 'disabled' : ''}>Prev</button>
      <span>Page ${page} of ${totalPages}</span>
      <button id="nextPage" ${page >= totalPages ? 'disabled' : ''}>Next</button>
    `;
    document.getElementById('prevPage').addEventListener('click', () => { state.page--; loadStudents(); });
    document.getElementById('nextPage').addEventListener('click', () => { state.page++; loadStudents(); });
  }

  function updateSortHeaders() {
    document.querySelectorAll('th[data-sort]').forEach((th) => {
      th.classList.toggle('sorted', th.dataset.sort === state.sortBy);
    });
  }

  async function loadStudents() {
    const params = new URLSearchParams({
      page: state.page,
      pageSize: state.pageSize,
      search: state.search,
      supervisor: state.supervisor,
      status: state.status,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
    });

    try {
      const res = await fetch(`/admin/students?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      renderSummary(data.summary);
      renderSupervisorOptions(data.supervisors);
      renderTable(data.students);
      renderPagination(data.page, data.totalPages);
      updateSortHeaders();
    } catch (err) {
      showToast('Failed to load students.', 'error');
    }
  }

  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      state.page = 1;
      loadStudents();
    }, 350);
  });

  supervisorFilter.addEventListener('change', () => {
    state.supervisor = supervisorFilter.value;
    state.page = 1;
    loadStudents();
  });

  statusFilter.addEventListener('change', () => {
    state.status = statusFilter.value;
    state.page = 1;
    loadStudents();
  });

  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (state.sortBy === col) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = col;
        state.sortDir = 'asc';
      }
      loadStudents();
    });
  });

  exportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      search: state.search,
      supervisor: state.supervisor,
      status: state.status,
    });
    window.location.href = `/admin/students/export?${params.toString()}`;
  });

  // --- Edit modal ---
  const editOverlay = document.getElementById('editOverlay');
  const editForm = document.getElementById('editForm');

  function openEditModal(student) {
    if (!student) return;
    document.getElementById('editId').value = student.id;
    document.getElementById('editRollNumber').value = student.rollNumber;
    document.getElementById('editFullName').value = student.fullName;
    document.getElementById('editSupervisor').value = student.supervisor;
    document.getElementById('editStatus').value = student.status;
    editOverlay.classList.add('show');
  }
  document.getElementById('cancelEdit').addEventListener('click', () => editOverlay.classList.remove('show'));

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id: document.getElementById('editId').value,
      fullName: document.getElementById('editFullName').value.trim(),
      supervisor: document.getElementById('editSupervisor').value.trim(),
      status: document.getElementById('editStatus').value,
    };
    try {
      const res = await fetch('/admin/student/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Update failed.', 'error');
        return;
      }
      showToast(data.message, 'success');
      editOverlay.classList.remove('show');
      loadStudents();
    } catch (err) {
      showToast('Network error while updating.', 'error');
    }
  });

  // --- Delete modal ---
  const deleteOverlay = document.getElementById('deleteOverlay');
  let pendingDeleteId = null;

  function openDeleteModal(id, name) {
    pendingDeleteId = id;
    document.getElementById('deleteName').textContent = name;
    deleteOverlay.classList.add('show');
  }
  document.getElementById('cancelDelete').addEventListener('click', () => deleteOverlay.classList.remove('show'));

  document.getElementById('confirmDelete').addEventListener('click', async () => {
    try {
      const res = await fetch('/admin/student/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingDeleteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Delete failed.', 'error');
        return;
      }
      showToast(data.message, 'success');
      deleteOverlay.classList.remove('show');
      loadStudents();
    } catch (err) {
      showToast('Network error while deleting.', 'error');
    }
  });

  loadStudents();
})();
