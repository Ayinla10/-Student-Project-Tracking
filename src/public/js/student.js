(function () {
  const rollNumberInput = document.getElementById('rollNumber');
  const fullNameInput = document.getElementById('fullName');
  const supervisorInput = document.getElementById('supervisor');
  const statusSelect = document.getElementById('status');
  const form = document.getElementById('studentForm');
  const submitBtn = document.getElementById('submitBtn');
  const lookupHint = document.getElementById('lookupHint');

  let knownStudent = false;
  let lookupTimer = null;

  function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
  }

  function setLockedFields(locked) {
    fullNameInput.readOnly = locked;
    supervisorInput.readOnly = locked;
    fullNameInput.required = !locked;
    supervisorInput.required = !locked;
  }

  async function lookupRollNumber(rollNumber) {
    if (!rollNumber) {
      lookupHint.textContent = '';
      knownStudent = false;
      setLockedFields(false);
      fullNameInput.value = '';
      supervisorInput.value = '';
      return;
    }
    try {
      const res = await fetch(`/api/student/${encodeURIComponent(rollNumber)}`);
      if (res.status === 404) {
        knownStudent = false;
        setLockedFields(false);
        fullNameInput.value = '';
        supervisorInput.value = '';
        lookupHint.textContent = 'New roll number — please complete the full registration form.';
        return;
      }
      const data = await res.json();
      if (data.exists) {
        knownStudent = true;
        fullNameInput.value = data.student.fullName;
        supervisorInput.value = data.student.supervisor;
        statusSelect.value = data.student.status;
        setLockedFields(true);
        lookupHint.textContent = `Welcome back, ${data.student.fullName}. Just update your current status below.`;
      }
    } catch (err) {
      lookupHint.textContent = '';
    }
  }

  rollNumberInput.addEventListener('input', () => {
    clearTimeout(lookupTimer);
    const value = rollNumberInput.value.trim();
    lookupTimer = setTimeout(() => lookupRollNumber(value), 400);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      rollNumber: rollNumberInput.value.trim(),
      fullName: fullNameInput.value.trim(),
      supervisor: supervisorInput.value.trim(),
      status: statusSelect.value,
    };

    if (!payload.rollNumber || !payload.status) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (!knownStudent && (!payload.fullName || !payload.supervisor)) {
      showToast('Full name and supervisor are required for first-time registration.', 'error');
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Something went wrong.', 'error');
        return;
      }
      showToast(data.message, 'success');
      knownStudent = true;
      setLockedFields(true);
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
})();
