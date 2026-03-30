import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, User, Home, Users, AlertCircle, BookOpen, Heart, FileText, DollarSign, Bus, Shield, Upload } from 'lucide-react';
import { registrationService } from '../services/registrationService';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADES = ['Grade R','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'];
const GENDERS = ['Male','Female','Other','Prefer not to say'];
const RACES = ['African','Coloured','Indian/Asian','White','Other'];
const HOME_LANGUAGES = ['Zulu','Xhosa','Afrikaans','English','Northern Sotho','Tswana','Sotho','Tsonga','Swati','Venda','Ndebele','Other'];
const RELATIONSHIPS = ['Mother','Father','Legal Guardian','Grandmother','Grandfather','Aunt','Uncle','Sibling','Other'];
const CURRENT_YEAR = new Date().getFullYear();
const DOCUMENT_TYPES = [
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate' },
  { value: 'LEARNER_ID', label: 'Learner ID Document' },
  { value: 'GUARDIAN_ID', label: 'Parent/Guardian ID' },
  { value: 'PROOF_OF_RESIDENCE', label: 'Proof of Residence' },
  { value: 'IMMUNISATION_CARD', label: 'Immunisation Card' },
  { value: 'PREVIOUS_REPORT', label: 'Previous School Report' },
  { value: 'TRANSFER_LETTER', label: 'Transfer Letter' },
  { value: 'COURT_ORDER', label: 'Court Order' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate' },
  { value: 'OTHER', label: 'Other' },
];

const STEPS = [
  { id: 'learner',    label: 'Learner Info',    icon: User },
  { id: 'address',   label: 'Address',          icon: Home },
  { id: 'guardians', label: 'Guardians',        icon: Users },
  { id: 'emergency', label: 'Emergency',        icon: AlertCircle },
  { id: 'admission', label: 'Admission',        icon: BookOpen },
  { id: 'medical',   label: 'Medical',          icon: Heart },
  { id: 'financial', label: 'Financial',        icon: DollarSign },
  { id: 'transport', label: 'Transport',        icon: Bus },
  { id: 'consents',  label: 'Consents',         icon: Shield },
  { id: 'documents', label: 'Documents',        icon: FileText },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#2d3748',
  background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#e53e3e' }}> *</span>}</label>
      {children}
    </div>
  );
}

function Input({ label, required, ...props }) {
  return (
    <Field label={label} required={required}>
      <input style={inputStyle} {...props} />
    </Field>
  );
}

function Select({ label, required, options, ...props }) {
  return (
    <Field label={label} required={required}>
      <select style={inputStyle} {...props}>
        <option value="">— Select —</option>
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#2d3748', marginBottom: '10px' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16 }} />
      {label}
    </label>
  );
}

function Grid({ children, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 20px' }}>
      {children}
    </div>
  );
}

// ─── Step Components ─────────────────────────────────────────────────────────

function LearnerInfoStep({ data, onChange }) {
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' }}>👤 Learner Personal Information</h3>
      <Grid>
        <Input label="First Name" required value={data.firstName} onChange={set('firstName')} placeholder="As per birth certificate" />
        <Input label="Surname" required value={data.lastName} onChange={set('lastName')} placeholder="Legal surname" />
        <Input label="Preferred Name" value={data.preferredName} onChange={set('preferredName')} placeholder="Name used in class" />
        <Select label="Gender" required options={GENDERS} value={data.gender} onChange={set('gender')} />
        <Input label="Date of Birth" required type="date" value={data.dateOfBirth} onChange={set('dateOfBirth')} />
        <Input label="SA ID Number" value={data.idNumber} onChange={set('idNumber')} placeholder="13-digit ID number" />
        <Input label="Passport Number" value={data.passportNumber} onChange={set('passportNumber')} placeholder="If no SA ID" />
        <Input label="Nationality" value={data.nationality} onChange={set('nationality')} placeholder="e.g. South African" />
        <Select label="Race (DBE Reporting)" options={RACES} value={data.race} onChange={set('race')} />
        <Select label="Home Language" options={HOME_LANGUAGES} value={data.homeLanguage} onChange={set('homeLanguage')} />
        <Input label="Religion (optional)" value={data.religion} onChange={set('religion')} placeholder="e.g. Christian, Muslim" />
        <Input label="Email Address" required type="email" value={data.email} onChange={set('email')} placeholder="learner@school.co.za" />
        <Input label="Phone Number" value={data.phone} onChange={set('phone')} placeholder="Cell number" />
        <Input label="Secondary Phone" value={data.secondaryPhone} onChange={set('secondaryPhone')} placeholder="Alternative number" />
      </Grid>
    </div>
  );
}

function AddressStep({ data, onChange }) {
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' }}>🏠 Residential & Contact Details</h3>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '16px', fontWeight: 600 }}>PHYSICAL ADDRESS</p>
      <Grid>
        <Input label="Street Address" value={data.address} onChange={set('address')} placeholder="12 Example Street" />
        <Input label="Suburb" value={data.suburb} onChange={set('suburb')} placeholder="Suburb name" />
        <Input label="City / Town" value={data.city} onChange={set('city')} placeholder="Johannesburg" />
        <Select label="Province" options={PROVINCES} value={data.province} onChange={set('province')} />
        <Input label="Postal Code" value={data.postalCode} onChange={set('postalCode')} placeholder="2000" />
      </Grid>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '16px', marginTop: '8px', fontWeight: 600 }}>POSTAL ADDRESS (if different)</p>
      <Field label="Postal Address">
        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }} value={data.postalAddress} onChange={set('postalAddress')} placeholder="PO Box or full postal address if different from physical" />
      </Field>
    </div>
  );
}

function GuardiansStep({ guardians, onChange }) {
  const emptyGuardian = () => ({
    firstName: '',
    lastName: '',
    relationship: '',
    idNumber: '',
    mobilePhone: '',
    workPhone: '',
    email: '',
    occupation: '',
    employer: '',
    isPrimaryGuardian: guardians.length === 0,
    livesWithLearner: true,
    hasLegalCustody: guardians.length === 0,
    courtOrderReference: '',
  });
  const addGuardian = () => onChange([...guardians, emptyGuardian()]);
  const removeGuardian = (i) => onChange(guardians.filter((_, idx) => idx !== i));
  const update = (i, field, value) => { const g = [...guardians]; g[i] = { ...g[i], [field]: value }; onChange(g); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748' }}>👨‍👩‍👧 Parent / Guardian Information</h3>
        <button type="button" onClick={addGuardian} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>+ Add Guardian</button>
      </div>
      {guardians.length === 0 && <p style={{ color: '#a0aec0', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No guardians added yet. Click "+ Add Guardian" to start.</p>}
      {guardians.map((g, i) => (
        <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, color: '#4a5568', fontSize: '14px' }}>Guardian {i + 1}{g.isPrimaryGuardian ? ' (Primary)' : ''}</span>
            <button type="button" onClick={() => removeGuardian(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}><X size={16} /></button>
          </div>
          <Grid>
            <Input label="First Name" required value={g.firstName} onChange={e => update(i, 'firstName', e.target.value)} />
            <Input label="Last Name" required value={g.lastName} onChange={e => update(i, 'lastName', e.target.value)} />
            <Select label="Relationship" required options={RELATIONSHIPS} value={g.relationship} onChange={e => update(i, 'relationship', e.target.value)} />
            <Input label="ID / Passport Number" value={g.idNumber} onChange={e => update(i, 'idNumber', e.target.value)} />
            <Input label="Mobile Phone" value={g.mobilePhone} onChange={e => update(i, 'mobilePhone', e.target.value)} />
            <Input label="Work Phone" value={g.workPhone} onChange={e => update(i, 'workPhone', e.target.value)} />
            <Input label="Email Address" type="email" value={g.email} onChange={e => update(i, 'email', e.target.value)} />
            <Input label="Occupation" value={g.occupation} onChange={e => update(i, 'occupation', e.target.value)} />
            <Input label="Employer" value={g.employer} onChange={e => update(i, 'employer', e.target.value)} />
          </Grid>
          <div style={{ marginTop: '8px' }}>
            <Checkbox label="Primary Guardian" checked={g.isPrimaryGuardian} onChange={e => update(i, 'isPrimaryGuardian', e.target.checked)} />
            <Checkbox label="Lives with learner" checked={g.livesWithLearner} onChange={e => update(i, 'livesWithLearner', e.target.checked)} />
            <Checkbox label="Has legal custody" checked={g.hasLegalCustody} onChange={e => update(i, 'hasLegalCustody', e.target.checked)} />
            {g.hasLegalCustody && <Input label="Court Order Reference" value={g.courtOrderReference} onChange={e => update(i, 'courtOrderReference', e.target.value)} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmergencyContactsStep({ contacts, onChange }) {
  const add = () => onChange([...contacts, { fullName: '', relationship: '', primaryPhone: '', alternatePhone: '', alternateContact: '' }]);
  const remove = (i) => onChange(contacts.filter((_, idx) => idx !== i));
  const update = (i, field, value) => { const c = [...contacts]; c[i] = { ...c[i], [field]: value }; onChange(c); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748' }}>🚨 Emergency Contact Information</h3>
        <button type="button" onClick={add} style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>+ Add Contact</button>
      </div>
      {contacts.length === 0 && <p style={{ color: '#a0aec0', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No emergency contacts added yet.</p>}
      {contacts.map((c, i) => (
        <div key={i} style={{ border: '1px solid #fed7d7', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 700, color: '#e53e3e', fontSize: '14px' }}>Emergency Contact {i + 1}</span>
            <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}><X size={16} /></button>
          </div>
          <Grid>
            <Input label="Full Name" required value={c.fullName} onChange={e => update(i, 'fullName', e.target.value)} />
            <Select label="Relationship" required options={RELATIONSHIPS} value={c.relationship} onChange={e => update(i, 'relationship', e.target.value)} />
            <Input label="Primary Phone" required value={c.primaryPhone} onChange={e => update(i, 'primaryPhone', e.target.value)} />
            <Input label="Alternate Phone" value={c.alternatePhone} onChange={e => update(i, 'alternatePhone', e.target.value)} />
            <Input label="Alternate Contact Name" value={c.alternateContact} onChange={e => update(i, 'alternateContact', e.target.value)} />
          </Grid>
        </div>
      ))}
    </div>
  );
}

function AdmissionStep({ data, onChange }) {
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' }}>🏫 Admission & Schooling Details</h3>
      <Grid>
        <Select label="Grade Applying For" required options={GRADES} value={data.currentGrade} onChange={set('currentGrade')} />
        <Input label="Year of Admission" type="number" value={data.yearOfAdmission} onChange={set('yearOfAdmission')} placeholder={CURRENT_YEAR.toString()} />
        <Input label="Date of Admission" required type="date" value={data.admissionDate} onChange={set('admissionDate')} />
        <Input label="Previous School Name" value={data.previousSchool} onChange={set('previousSchool')} />
        <Input label="Previous School EMIS Number" value={data.previousSchoolEmis} onChange={set('previousSchoolEmis')} />
        <Select label="Language of Learning & Teaching (LOLT)" options={HOME_LANGUAGES} value={data.lolt} onChange={set('lolt')} />
        <Input label="Last Grade Passed" value={data.lastGradePassed} onChange={set('lastGradePassed')} placeholder="e.g. Grade 7" />
        <Input label="Reason for Leaving Previous School" value={data.reasonForLeaving} onChange={set('reasonForLeaving')} />
      </Grid>
      <Checkbox label="Transfer card received" checked={data.transferCardReceived} onChange={set('transferCardReceived')} />
      <Checkbox label="Repeating this grade" checked={data.repeatingGrade} onChange={set('repeatingGrade')} />
      <Field label="Assessment Accommodations (if any)">
        <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={data.assessmentAccommodations} onChange={set('assessmentAccommodations')} placeholder="e.g. Extended time, large print, reader..." />
      </Field>
    </div>
  );
}

function MedicalStep({ data, onChange }) {
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' }}>🩺 Medical Information</h3>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px', fontWeight: 600 }}>MEDICAL AID & DOCTOR</p>
      <Grid>
        <Input label="Medical Aid Name" value={data.medicalAidName} onChange={set('medicalAidName')} />
        <Input label="Medical Aid Number" value={data.medicalAidNumber} onChange={set('medicalAidNumber')} />
        <Input label="Doctor / Clinic Name" value={data.doctorName} onChange={set('doctorName')} />
        <Input label="Doctor Contact Number" value={data.doctorPhone} onChange={set('doctorPhone')} />
        <Select label="Blood Type" options={['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']} value={data.bloodType} onChange={set('bloodType')} />
      </Grid>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px', marginTop: '8px', fontWeight: 600 }}>HEALTH CONDITIONS</p>
      {[
        ['Allergies', 'allergies', 'e.g. Penicillin, nuts, bee stings'],
        ['Chronic Illnesses', 'chronicIllnesses', 'e.g. Asthma, diabetes, epilepsy'],
        ['Disabilities', 'disabilities', 'e.g. Physical, learning, sensory'],
        ['Current Medications', 'medications', 'Name, dosage, frequency'],
        ['Special Dietary Requirements', 'dietaryRequirements', 'e.g. Halaal, kosher, vegan, allergies'],
        ['Medical Conditions (general)', 'medicalConditions', 'Any other relevant medical history'],
      ].map(([label, field, placeholder]) => (
        <Field key={field} label={label}>
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={data[field]} onChange={set(field)} placeholder={placeholder} />
        </Field>
      ))}
      <Checkbox label="Permission granted for emergency medical treatment" checked={data.emergencyTreatmentConsent} onChange={set('emergencyTreatmentConsent')} />
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px', marginTop: '16px', fontWeight: 600 }}>SPECIAL NEEDS & SUPPORT</p>
      {[
        ['Learning Barriers', 'learningBarriers', 'Describe any known learning barriers'],
        ['Psychological Assessments', 'psychologicalAssessments', 'e.g. ADHD assessment, psycho-educational'],
        ['Support Services', 'supportServices', 'e.g. Speech therapy, OT, counselling'],
      ].map(([label, field, placeholder]) => (
        <Field key={field} label={label}>
          <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={data[field]} onChange={set(field)} placeholder={placeholder} />
        </Field>
      ))}
      <Checkbox label="Individual Education Plan (IEP) required" checked={data.iepRequired} onChange={set('iepRequired')} />
    </div>
  );
}

function FinancialStep({ data, onChange }) {
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' }}>💰 Financial Information</h3>
      <Grid>
        <Select label="Fee Category" options={['Standard','Reduced','Exempt','Bursary']} value={data.feeCategory} onChange={set('feeCategory')} />
        <Select label="Household Income Bracket" options={['R0 – R48 000','R48 001 – R96 000','R96 001 – R200 000','R200 001 – R350 000','Above R350 000']} value={data.householdIncomeBracket} onChange={set('householdIncomeBracket')} />
        <Select label="Parent/Guardian Employment Status" options={['Employed','Self-employed','Unemployed','Pensioner','Disability Grant','SASSA']} value={data.parentEmploymentStatus} onChange={set('parentEmploymentStatus')} />
        <Input label="Billing Contact Person" value={data.billingContact} onChange={set('billingContact')} placeholder="Name of person responsible for fees" />
        <Select label="Payment Plan" options={['Monthly','Quarterly','Annual','Once-off']} value={data.paymentPlan} onChange={set('paymentPlan')} />
        <Input label="Account Number (internal)" value={data.accountNumber} onChange={set('accountNumber')} />
        <Input label="Exemption Reason" value={data.exemptionReason} onChange={set('exemptionReason')} placeholder="Reason for fee exemption (if applicable)" />
      </Grid>
      <Checkbox label="Fee Exemption Granted" checked={data.feeExemption} onChange={set('feeExemption')} />
    </div>
  );
}

function TransportStep({ data, onChange }) {
  const set = (field) => (e) => onChange({ ...data, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' }}>🚌 Transport Information</h3>
      <Checkbox label="Transport required" checked={data.transportRequired} onChange={set('transportRequired')} />
      {data.transportRequired && (
        <Grid>
          <Input label="Pickup Address" value={data.transportPickupAddress} onChange={set('transportPickupAddress')} placeholder="Where to pick up learner" />
          <Input label="Drop-off Address" value={data.transportDropoffAddress} onChange={set('transportDropoffAddress')} placeholder="Where to drop off learner" />
          <Input label="Transport Provider" value={data.transportProvider} onChange={set('transportProvider')} placeholder="e.g. School Bus Services Ltd" />
          <Input label="Route Number" value={data.transportRouteNumber} onChange={set('transportRouteNumber')} placeholder="e.g. Route 12A" />
        </Grid>
      )}
    </div>
  );
}

function ConsentsStep({ consents, onChange }) {
  const toggle = (key) => onChange({ ...consents, [key]: !consents[key] });
  const CONSENT_ITEMS = [
    { key: 'POPIA', label: 'POPIA Consent', desc: 'I consent to the collection and processing of personal information in accordance with the Protection of Personal Information Act (POPIA).' },
    { key: 'MEDIA', label: 'Media Consent', desc: 'I consent to photographs and/or videos of the learner being taken and used for school/educational purposes.' },
    { key: 'CODE_OF_CONDUCT', label: 'Code of Conduct', desc: 'I have read and agree to abide by the school Code of Conduct.' },
    { key: 'INDEMNITY', label: 'Indemnity Form', desc: 'I acknowledge and accept the school indemnity terms for school activities and outings.' },
    { key: 'ICT_POLICY', label: 'ICT / Internet Usage Policy', desc: 'I agree to the school\'s responsible use of technology and internet policy.' },
  ];
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '8px' }}>🧾 Consent & Legal Agreements</h3>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '20px' }}>Please read and provide consent for each item below.</p>
      {CONSENT_ITEMS.map(({ key, label, desc }) => (
        <div key={key} style={{ border: `2px solid ${consents[key] ? '#48bb78' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', marginBottom: '12px', background: consents[key] ? '#f0fff4' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => toggle(key)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: consents[key] ? '#48bb78' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {consents[key] && <Check size={14} color="#fff" />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#2d3748' }}>{label}</div>
              <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsStep({ studentId, onClose }) {
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  if (!studentId) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#718096' }}>
        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
        <p style={{ fontSize: '15px', fontWeight: 600 }}>Documents can be uploaded after registration is complete.</p>
        <p style={{ fontSize: '13px', marginTop: '8px' }}>The learner must be registered first. You can upload documents from the student's profile page.</p>
      </div>
    );
  }

  const handleFile = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      await registrationService.uploadDocument(studentId, file, docType);
      setUploads(u => [...u, { type: docType, name: file.name }]);
      setMessage(`✅ ${file.name} uploaded successfully`);
    } catch (err) {
      setMessage(`❌ Upload failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '8px' }}>📄 Required Documents</h3>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '20px' }}>Upload supporting documents for verification.</p>
      {message && <div style={{ padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', background: message.startsWith('✅') ? '#f0fff4' : '#fff5f5', color: message.startsWith('✅') ? '#276749' : '#c53030', fontSize: '13px' }}>{message}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {DOCUMENT_TYPES.map(dt => {
          const uploaded = uploads.find(u => u.type === dt.value);
          return (
            <label key={dt.value} style={{ border: `2px dashed ${uploaded ? '#48bb78' : '#e2e8f0'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', background: uploaded ? '#f0fff4' : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <input type="file" style={{ display: 'none' }} disabled={uploading} onChange={e => handleFile(e, dt.value)} accept=".pdf,.jpg,.jpeg,.png" />
              {uploaded ? <Check size={24} color="#48bb78" /> : <Upload size={24} color="#a0aec0" />}
              <span style={{ fontSize: '12px', fontWeight: 600, color: uploaded ? '#276749' : '#4a5568', textAlign: 'center' }}>{dt.label}</span>
              {uploaded && <span style={{ fontSize: '11px', color: '#48bb78' }}>{uploaded.name}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function LearnerRegistrationWizard({ onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [registeredStudentId, setRegisteredStudentId] = useState(null);

  const [learner, setLearner] = useState({
    firstName: '', lastName: '', preferredName: '', email: '', phone: '', secondaryPhone: '',
    idNumber: '', passportNumber: '', dateOfBirth: '', gender: 'Male',
    nationality: 'South African', race: '', homeLanguage: '', religion: '',
  });

  const [address, setAddress] = useState({
    address: '', suburb: '', city: '', province: '', postalCode: '', postalAddress: '',
  });

  const [guardians, setGuardians] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  const [admission, setAdmission] = useState({
    currentGrade: 'Grade 8', gradeApplyingFor: '', yearOfAdmission: CURRENT_YEAR,
    admissionDate: new Date().toISOString().split('T')[0],
    previousSchool: '', previousSchoolEmis: '', transferCardReceived: false,
    reasonForLeaving: '', lastGradePassed: '', repeatingGrade: false,
    lolt: '', assessmentAccommodations: '',
  });

  const [medical, setMedical] = useState({
    medicalAidName: '', medicalAidNumber: '', doctorName: '', doctorPhone: '',
    medicalConditions: '', allergies: '', chronicIllnesses: '', disabilities: '',
    medications: '', bloodType: '', dietaryRequirements: '', emergencyTreatmentConsent: false,
    learningBarriers: '', iepRequired: false, psychologicalAssessments: '', supportServices: '',
  });

  const [financial, setFinancial] = useState({
    feeCategory: 'Standard', feeExemption: false, exemptionReason: '',
    householdIncomeBracket: '', parentEmploymentStatus: '', billingContact: '',
    paymentPlan: 'Monthly', accountNumber: '',
  });

  const [transport, setTransport] = useState({
    transportRequired: false, transportPickupAddress: '', transportDropoffAddress: '',
    transportProvider: '', transportRouteNumber: '',
  });

  const [consents, setConsents] = useState({
    POPIA: false, MEDIA: false, CODE_OF_CONDUCT: false, INDEMNITY: false, ICT_POLICY: false,
  });

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'learner':    return <LearnerInfoStep data={learner} onChange={setLearner} />;
      case 'address':   return <AddressStep data={address} onChange={setAddress} />;
      case 'guardians': return <GuardiansStep guardians={guardians} onChange={setGuardians} />;
      case 'emergency': return <EmergencyContactsStep contacts={emergencyContacts} onChange={setEmergencyContacts} />;
      case 'admission': return <AdmissionStep data={admission} onChange={setAdmission} />;
      case 'medical':   return <MedicalStep data={medical} onChange={setMedical} />;
      case 'financial': return <FinancialStep data={financial} onChange={setFinancial} />;
      case 'transport': return <TransportStep data={transport} onChange={setTransport} />;
      case 'consents':  return <ConsentsStep consents={consents} onChange={setConsents} />;
      case 'documents': return <DocumentsStep studentId={registeredStudentId} />;
      default:          return null;
    }
  };

  // eslint-disable-next-line no-unused-vars
  const isLastStep = step === STEPS.length - 1;
  const isDocStep = STEPS[step].id === 'documents';

  const handleSubmit = async () => {
    if (registeredStudentId) {
      // Already registered, just proceed
      onSuccess && onSuccess(registeredStudentId);
      onClose();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...learner,
        ...address,
        ...admission,
        ...medical,
        ...financial,
        ...transport,
        guardians,
        emergencyContacts,
        consents,
      };
      const result = await registrationService.register(payload);
      setRegisteredStudentId(result.data.id);
      setStep(STEPS.length - 1); // Go to documents step
      onSuccess && onSuccess(result.data.id);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '20px', margin: 0 }}>🎓 Learner Registration</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: '4px 0 0' }}>South African Government School Admission Form</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff' }}><X size={20} /></button>
        </div>

        {/* Step Indicator */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px', minWidth: 'max-content' }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step || (registeredStudentId && i < STEPS.length - 1);
              return (
                <button key={s.id} type="button" onClick={() => i <= step && setStep(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: i <= step ? 'pointer' : 'default', background: isActive ? 'linear-gradient(135deg,#667eea,#764ba2)' : isDone ? '#e9d8fd' : '#f7fafc', color: isActive ? '#fff' : isDone ? '#553c9a' : '#a0aec0', fontWeight: isActive ? 700 : 500, fontSize: '11px', transition: 'all 0.2s', minWidth: '64px' }}>
                  {isDone && !isActive ? <Check size={14} /> : <Icon size={14} />}
                  <span style={{ whiteSpace: 'nowrap' }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#c53030', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '13px', color: '#718096' }}>
            Step {step + 1} of {STEPS.length}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#4a5568' }}>
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {isDocStep ? (
              <button type="button" onClick={() => { onSuccess && onSuccess(registeredStudentId); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                <Check size={16} /> Done
              </button>
            ) : step === STEPS.length - 2 ? (
              <button type="button" onClick={handleSubmit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', background: saving ? '#a0aec0' : 'linear-gradient(135deg,#48bb78,#38a169)', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700 }}>
                {saving ? '⏳ Registering...' : <><Check size={16} /> Submit Registration</>}
              </button>
            ) : (
              <button type="button" onClick={() => setStep(s => s + 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
