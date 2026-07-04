(function () {
  const STATUS_VALUES = window.STATUS_VALUES || [];

  function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
  }

  function setBtnLoading(btn, loading) {
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
  }

  function renderProgressTracker(container, currentStatus) {
    const currentIndex = STATUS_VALUES.indexOf(currentStatus);
    container.innerHTML = STATUS_VALUES.map((stage, i) => {
      let stateClass = 'upcoming';
      if (i < currentIndex) stateClass = 'done';
      else if (i === currentIndex) stateClass = 'current';
      return `
        <div class="progress-step ${stateClass}">
          <span class="progress-dot">${i < currentIndex ? '&#10003;' : i + 1}</span>
          <span class="progress-label">${stage}</span>
        </div>
      `;
    }).join('');
  }

  // ---------------- Tabs ----------------
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
    });
  });

  function switchToTab(tab) {
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).click();
  }

  // ---------------- Update My Progress ----------------
  const lookupRollNumber = document.getElementById('lookupRollNumber');
  const findRecordBtn = document.getElementById('findRecordBtn');
  const lookupError = document.getElementById('lookupError');
  const updateRevealed = document.getElementById('updateRevealed');
  const updateForm = document.getElementById('updateForm');
  let currentRollNumber = null;

  findRecordBtn.addEventListener('click', async () => {
    const rollNumber = lookupRollNumber.value.trim();
    lookupError.textContent = '';
    updateRevealed.hidden = true;

    if (!rollNumber) {
      lookupError.textContent = 'Please enter your roll number.';
      return;
    }

    setBtnLoading(findRecordBtn, true);
    try {
      const res = await fetch(`/api/student/${encodeURIComponent(rollNumber)}`);
      if (res.status === 404) {
        lookupError.innerHTML = `No record found for that roll number. <button type="button" class="link-btn" id="goRegister">Register here instead &rarr;</button>`;
        document.getElementById('goRegister').addEventListener('click', () => switchToTab('register'));
        return;
      }
      const data = await res.json();
      currentRollNumber = data.student.rollNumber;
      document.getElementById('roFullName').textContent = data.student.fullName;
      document.getElementById('roSupervisor').textContent = data.student.supervisor;
      document.getElementById('updateStatus').value = data.student.status;
      renderProgressTracker(document.getElementById('progressTracker'), data.student.status);
      updateRevealed.hidden = false;
    } catch (err) {
      lookupError.textContent = 'Network error. Please try again.';
    } finally {
      setBtnLoading(findRecordBtn, false);
    }
  });

  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('updateStatus').value;
    const updateBtn = document.getElementById('updateBtn');

    setBtnLoading(updateBtn, true);
    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: currentRollNumber, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Something went wrong.', 'error');
        return;
      }
      showToast(data.message, 'success');
      renderProgressTracker(document.getElementById('progressTracker'), status);
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setBtnLoading(updateBtn, false);
    }
  });

  // ---------------- First-Time Registration ----------------
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const supervisor = document.getElementById('supervisor').value.trim();
    const status = document.getElementById('status').value;
    const registerBtn = document.getElementById('registerBtn');

    if (!rollNumber || !fullName || !supervisor || !status) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setBtnLoading(registerBtn, true);
    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, fullName, supervisor, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Something went wrong.', 'error');
        return;
      }
      showToast(data.message, 'success');
      registerForm.reset();
      lookupRollNumber.value = rollNumber;
      switchToTab('update');
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setBtnLoading(registerBtn, false);
    }
  });
})();
