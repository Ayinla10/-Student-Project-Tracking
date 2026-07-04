(function () {
  const STATUS_VALUES = window.STATUS_VALUES || [];

  // ---------------- Announcement popup ----------------
  const ANNOUNCEMENT_KEY = 'announcement_defense_2026_09_05_dismissed';
  const announcementOverlay = document.getElementById('announcementOverlay');
  if (announcementOverlay) {
    if (!sessionStorage.getItem(ANNOUNCEMENT_KEY)) {
      announcementOverlay.classList.add('show');
    }
    const dismissAnnouncement = () => {
      announcementOverlay.classList.remove('show');
      sessionStorage.setItem(ANNOUNCEMENT_KEY, '1');
    };
    document.getElementById('announcementClose').addEventListener('click', dismissAnnouncement);
    document.getElementById('announcementGotIt').addEventListener('click', dismissAnnouncement);
    announcementOverlay.addEventListener('click', (e) => {
      if (e.target === announcementOverlay) dismissAnnouncement();
    });
  }

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
  const updateFormArea = document.getElementById('updateFormArea');
  const updateSuccess = document.getElementById('updateSuccess');
  const updateSuccessText = document.getElementById('updateSuccessText');
  let currentRollNumber = null;
  let currentFullName = null;

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
        lookupError.innerHTML = `This roll number doesn't exist. <button type="button" class="link-btn" id="goRegister">Use First-Time Registration &rarr;</button>`;
        document.getElementById('goRegister').addEventListener('click', () => {
          document.getElementById('rollNumber').value = rollNumber;
          switchToTab('register');
          checkRegisterRollNumber();
        });
        return;
      }
      const data = await res.json();
      currentRollNumber = data.student.rollNumber;
      currentFullName = data.student.fullName;
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
      updateSuccessText.textContent = `${currentFullName || 'Your'} record is now marked as "${status}". Come back any time to move it forward.`;
      updateFormArea.hidden = true;
      updateSuccess.hidden = false;
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setBtnLoading(updateBtn, false);
    }
  });

  document.getElementById('updateAgainBtn').addEventListener('click', () => {
    updateSuccess.hidden = true;
    updateFormArea.hidden = false;
  });

  // ---------------- First-Time Registration ----------------
  const registerForm = document.getElementById('registerForm');
  const registerFormArea = document.getElementById('registerFormArea');
  const registerSuccess = document.getElementById('registerSuccess');
  const registerSuccessText = document.getElementById('registerSuccessText');
  const registerRollInput = document.getElementById('rollNumber');
  const registerRollHint = document.getElementById('registerRollHint');
  const registerRestFields = document.getElementById('registerRestFields');
  let registerRollBlocked = false;
  let registerCheckTimer = null;
  let registerCheckToken = 0;

  function setRegisterFieldsEnabled(enabled) {
    registerRestFields.style.display = enabled ? '' : 'none';
  }

  async function checkRegisterRollNumber() {
    const rollNumber = registerRollInput.value.trim();
    const token = ++registerCheckToken;
    registerRollHint.innerHTML = '';
    registerRollBlocked = false;

    if (!rollNumber) {
      setRegisterFieldsEnabled(true);
      return;
    }

    try {
      const res = await fetch(`/api/student/${encodeURIComponent(rollNumber)}`);
      if (token !== registerCheckToken) return; // a newer check superseded this one

      if (res.status === 404) {
        setRegisterFieldsEnabled(true);
        return;
      }

      // Roll number already exists — block registration and point to the updater.
      registerRollBlocked = true;
      setRegisterFieldsEnabled(false);
      registerRollHint.innerHTML = `This roll number is already registered. <button type="button" class="link-btn" id="goUpdate">Use Update My Progress instead &rarr;</button>`;
      document.getElementById('goUpdate').addEventListener('click', () => {
        lookupRollNumber.value = rollNumber;
        switchToTab('update');
        findRecordBtn.click();
      });
    } catch (err) {
      // Network hiccup — don't block the form over a failed check.
    }
  }

  registerRollInput.addEventListener('input', () => {
    clearTimeout(registerCheckTimer);
    registerCheckTimer = setTimeout(checkRegisterRollNumber, 450);
  });
  registerRollInput.addEventListener('blur', checkRegisterRollNumber);

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rollNumber = registerRollInput.value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const supervisor = document.getElementById('supervisor').value.trim();
    const status = document.getElementById('status').value;
    const registerBtn = document.getElementById('registerBtn');

    if (registerRollBlocked) {
      showToast('That roll number is already registered — use Update My Progress instead.', 'error');
      return;
    }
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
      registerSuccessText.textContent = `Thanks, ${fullName}! Your roll number ${rollNumber} is now registered with status "${status}". Use Update My Progress any time to move it forward.`;
      registerFormArea.hidden = true;
      registerSuccess.hidden = false;
      registerForm.reset();
      setRegisterFieldsEnabled(true);
      registerRollHint.innerHTML = '';
      lookupRollNumber.value = rollNumber;
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setBtnLoading(registerBtn, false);
    }
  });

  document.getElementById('goUpdateAfterRegister').addEventListener('click', () => {
    registerSuccess.hidden = true;
    registerFormArea.hidden = false;
    switchToTab('update');
    findRecordBtn.click();
  });
})();
