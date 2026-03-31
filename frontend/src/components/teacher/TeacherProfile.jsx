import React, { useState, useEffect } from 'react';
import { Edit, Save, X, User, Mail, Phone, Award, BookOpen } from 'lucide-react';
import teacherService from '../../services/teacherService';
import authService from '../../services/authService';

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 0',
      borderBottom: '1px solid rgba(102,126,234,0.08)',
    }}>
      {Icon && (
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(102,126,234,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color="#667eea" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '15px', color: '#1a202c', marginTop: '2px', fontWeight: 500 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function TeacherProfile({ user, onUserUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    qualifications: '',
    specialization: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const teacherId = user?.teacherProfile?.id;

  useEffect(() => {
    if (!teacherId) {
      // Fall back to user object
      setProfile(user);
      setForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        qualifications: user?.teacherProfile?.qualifications || '',
        specialization: user?.teacherProfile?.specialization || '',
        address: user?.teacherProfile?.address || '',
        emergencyContact: user?.teacherProfile?.emergencyContact || '',
        emergencyPhone: user?.teacherProfile?.emergencyPhone || '',
      });
      return;
    }
    setLoading(true);
    teacherService.getById(teacherId)
      .then(res => {
        const data = res?.data || res;
        setProfile(data);
        setForm({
          firstName: data?.user?.firstName || data?.firstName || '',
          lastName: data?.user?.lastName || data?.lastName || '',
          phone: data?.user?.phone || data?.phone || '',
          qualifications: data?.qualifications || '',
          specialization: data?.specialization || '',
          address: data?.address || '',
          emergencyContact: data?.emergencyContact || '',
          emergencyPhone: data?.emergencyPhone || '',
        });
      })
      .catch(() => {
        setProfile(user);
        setForm({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          phone: user?.phone || '',
          qualifications: user?.teacherProfile?.qualifications || '',
          specialization: user?.teacherProfile?.specialization || '',
          address: user?.teacherProfile?.address || '',
          emergencyContact: user?.teacherProfile?.emergencyContact || '',
          emergencyPhone: user?.teacherProfile?.emergencyPhone || '',
        });
      })
      .finally(() => setLoading(false));
  }, [teacherId, user]);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!teacherId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await teacherService.update(teacherId, form);
      const updated = res?.data || res;
      setProfile(updated);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      if (onUserUpdate) {
        // Refresh user session
        const userData = await authService.getCurrentUser().catch(() => null);
        if (userData) onUserUpdate(userData?.data || userData);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const firstName = profile?.user?.firstName || profile?.firstName || user?.firstName || '';
  const lastName = profile?.user?.lastName || profile?.lastName || user?.lastName || '';
  const email = profile?.user?.email || profile?.email || user?.email || '';
  const phone = profile?.user?.phone || profile?.phone || user?.phone || '';
  const employeeNumber = profile?.employeeNumber || '—';
  const saceNumber = profile?.saceNumber || '—';
  const contractType = profile?.contractType || '—';
  const qualifications = profile?.qualifications || '—';
  const specialization = profile?.specialization || '—';
  const yearsExp = profile?.yearsExperience != null ? `${profile.yearsExperience} years` : '—';
  const subjects = (profile?.subjectTeaching || []).map(s => s?.subject?.name || s?.name || s).filter(Boolean).join(', ') || '—';
  const classes = (profile?.classes || []).map(c => c?.name || c).filter(Boolean).join(', ') || '—';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: '#718096' }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and update your teacher profile</p>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#065f46', marginBottom: '24px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Avatar Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '36px',
            color: 'white',
            fontWeight: 700,
          }}>
            {firstName.charAt(0)}{lastName.charAt(0)}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', marginBottom: '4px' }}>
            {firstName} {lastName}
          </div>
          <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 600, marginBottom: '8px' }}>Teacher</div>
          <div style={{ fontSize: '13px', color: '#718096', marginBottom: '20px' }}>{email}</div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ padding: '10px', background: 'rgba(102,126,234,0.05)', borderRadius: '10px', fontSize: '13px', color: '#4a5568' }}>
              <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '2px' }}>Employee #</div>
              {employeeNumber}
            </div>
            <div style={{ padding: '10px', background: 'rgba(102,126,234,0.05)', borderRadius: '10px', fontSize: '13px', color: '#4a5568' }}>
              <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '2px' }}>SACE #</div>
              {saceNumber}
            </div>
            <div style={{ padding: '10px', background: 'rgba(102,126,234,0.05)', borderRadius: '10px', fontSize: '13px', color: '#4a5568' }}>
              <div style={{ fontWeight: 700, color: '#667eea', marginBottom: '2px' }}>Contract</div>
              {contractType}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a202c' }}>Personal Information</h3>
            {!editing ? (
              <button className="action-button" onClick={() => setEditing(true)}>
                <Edit size={14} />
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="action-button primary" onClick={handleSave} disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="action-button" onClick={() => setEditing(false)}>
                  <X size={14} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <InfoRow label="Full Name" value={`${firstName} ${lastName}`} icon={User} />
              <InfoRow label="Email" value={email} icon={Mail} />
              <InfoRow label="Phone" value={phone} icon={Phone} />
              <InfoRow label="Qualifications" value={qualifications} icon={Award} />
              <InfoRow label="Specialization" value={specialization} icon={BookOpen} />
              <InfoRow label="Experience" value={yearsExp} icon={Award} />
              <InfoRow label="Subjects" value={subjects} icon={BookOpen} />
              <InfoRow label="Classes" value={classes} icon={BookOpen} />
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { name: 'firstName', label: 'First Name', type: 'text' },
                { name: 'lastName', label: 'Last Name', type: 'text' },
                { name: 'phone', label: 'Phone', type: 'tel' },
                { name: 'specialization', label: 'Specialization', type: 'text' },
                { name: 'emergencyContact', label: 'Emergency Contact', type: 'text' },
                { name: 'emergencyPhone', label: 'Emergency Phone', type: 'tel' },
              ].map(field => (
                <div className="form-group" key={field.name} style={{ margin: 0 }}>
                  <label className="form-label">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    className="form-input"
                    value={form[field.name]}
                    onChange={handleChange}
                  />
                </div>
              ))}
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label className="form-label">Qualifications</label>
                <textarea
                  name="qualifications"
                  className="form-textarea"
                  value={form.qualifications}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. B.Ed Mathematics, PGCE"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-textarea"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
