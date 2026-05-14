/**
 * Generates two reference Excel files into /examples for end-users to
 * download/fill:
 *
 *   - contacts-template.xlsx — bulk biodata source (one row per person).
 *     Settings → Import contacts → produces N CVs via "Generate all".
 *
 *   - cv-template.xlsx — single CV with all sections in separate sheets.
 *     Editor → Import Excel → fills the form for one person.
 *
 * Run: node scripts/buildExcelTemplates.js
 */

import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'examples');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Auto-fit column widths from the longest cell value per column.
function autosize(rows) {
  if (!rows.length) return [];
  const widths = {};
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      widths[k] = Math.max(widths[k] || k.length, String(v ?? '').length);
    }
  }
  return Object.keys(rows[0]).map((k) => ({ wch: Math.min(Math.max(widths[k] + 2, 12), 50) }));
}

function aoaSheet(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = autosize(rows);
  return ws;
}

// ============================================================ contacts ===
// Multi-sheet format: `contacts` for biodata (one row per person, with an
// `id` column), plus optional per-section sheets that link via `contact_id`.

const contactsRows = [
  {
    id: 1,
    full_name: 'Dedi Faizal',
    job_title: 'Specialist Crane Technician',
    place_of_birth: 'Jakarta',
    date_of_birth: '02 Oktober 1980',
    sex: 'Male',
    nationality: 'Indonesia',
    last_education: 'S1 Teknik Industri',
    email: 'dedi.faizal@example.com',
    phone: '+62 812 3456 7890',
    address: 'Jakarta, Indonesia',
    linkedin: 'linkedin.com/in/dedifaizal',
    website: '',
    summary:
      'Crane technician with 15+ years offshore experience across maintenance, ' +
      'inspection, and rigging operations.',
  },
  {
    id: 2,
    full_name: 'Sari Wulandari',
    job_title: 'HSE Officer',
    place_of_birth: 'Bandung',
    date_of_birth: '14 Mei 1990',
    sex: 'Female',
    nationality: 'Indonesia',
    last_education: 'S1 Teknik Lingkungan',
    email: 'sari.w@example.com',
    phone: '+62 811 9876 5432',
    address: 'Bandung, Indonesia',
    linkedin: 'linkedin.com/in/sariwulandari',
    website: '',
    summary:
      'HSE professional focused on risk assessment, permit-to-work systems, ' +
      'and offshore safety audits.',
  },
  {
    id: 3,
    full_name: 'Budi Santoso',
    job_title: 'Mechanical Engineer',
    place_of_birth: 'Surabaya',
    date_of_birth: '07 Maret 1985',
    sex: 'Male',
    nationality: 'Indonesia',
    last_education: 'S1 Teknik Mesin',
    email: 'budi.s@example.com',
    phone: '+62 813 1122 3344',
    address: 'Surabaya, Indonesia',
    linkedin: '',
    website: '',
    summary:
      'Mechanical engineer with experience in piping fabrication, pump ' +
      'systems, and reliability maintenance for oil & gas plants.',
  },
];

const contactsExperiences = [
  { contact_id: 1, role: 'Specialist Crane Technician/Operator', company: 'PT Elnusa Tbk', duration: 'Oct 2012 — Now', location: 'Indonesia', description: 'Lead crane maintenance and inspection across offshore platforms.' },
  { contact_id: 1, role: 'Crane Specialist & Maintenance', company: 'PT Example Two', duration: 'Sep 2010 — Sep 2012', location: 'Jakarta', description: 'Lattice crane inspector & scaffolding supervisor.' },
  { contact_id: 2, role: 'HSE Officer', company: 'PT Wijaya Karya', duration: 'Jan 2015 — Now', location: 'Bandung', description: 'Risk assessment, audit, and incident investigation across plant sites.' },
  { contact_id: 3, role: 'Senior Mechanical Engineer', company: 'PT Pertamina', duration: 'Jun 2018 — Now', location: 'Surabaya', description: 'Piping fabrication, pump reliability, and turnaround planning.' },
];

const contactsEducation = [
  { contact_id: 1, institution: 'Universitas UICI', degree: 'S1 Teknik Industri', year: '2018 — 2022', description: '' },
  { contact_id: 2, institution: 'Institut Teknologi Bandung', degree: 'S1 Teknik Lingkungan', year: '2008 — 2012', description: '' },
  { contact_id: 3, institution: 'Institut Teknologi Sepuluh Nopember', degree: 'S1 Teknik Mesin', year: '2003 — 2008', description: '' },
];

const contactsSkills = [
  { contact_id: 1, name: 'Crane Operation', level: 'Expert' },
  { contact_id: 1, name: 'Hydraulics', level: 'Advanced' },
  { contact_id: 2, name: 'Risk Assessment', level: 'Expert' },
  { contact_id: 2, name: 'Permit to Work', level: 'Expert' },
  { contact_id: 3, name: 'Piping Design', level: 'Advanced' },
  { contact_id: 3, name: 'Pump Reliability', level: 'Expert' },
];

const contactsTrainings = [
  { contact_id: 1, name: 'Sertifikat inspector Pesawat angkat angkut crane IPA MIGAS and BNSP', organizer: 'MIGAS / BNSP', year: '2020', location: 'Jakarta', description: '' },
  { contact_id: 1, name: 'Sertifikat Scaffolding Inspector BNSP', organizer: 'BNSP', year: '2019', location: 'Jakarta', description: '' },
  { contact_id: 2, name: 'NEBOSH IGC', organizer: 'NEBOSH', year: '2017', location: 'Singapore', description: '' },
  { contact_id: 3, name: 'API 570 Piping Inspector', organizer: 'API', year: '2020', location: 'Jakarta', description: '' },
];

const contactsCertifications = [
  { contact_id: 1, name: 'Sertifikat Asesment Crosby', issuer: 'Crosby', year: '2021' },
  { contact_id: 2, name: 'IOSH Managing Safely', issuer: 'IOSH', year: '2016' },
];

const contactsProjects = [
  {
    contact_id: 1,
    project:
      'Fabrikasi & Pemeliharaan Konstruksi Struktur, Pipa, dan Sipil di Jatibarang Field\n' +
      'Penyisihan Main Oil Line XAP ke MGS Balongan – Offshore',
    time_schedule: 'Oct 2012 — Now',
    company: 'PT Elnusa Tbk',
    location: 'Indonesia',
    position: 'Specialist Crane Technician',
    responsibility:
      'Lead crane preventive and corrective maintenance.\n' +
      'Inspect mechanical/hydraulic systems for reliability and safety.\n' +
      'Coordinate with operations during lifting campaigns.',
    link: '',
  },
  {
    contact_id: 2,
    project: 'Plant-wide Safety Audit & PTW System Rollout',
    time_schedule: 'Mar 2020 — Dec 2021',
    company: 'PT Wijaya Karya',
    location: 'Bandung',
    position: 'HSE Officer',
    responsibility:
      'Designed and rolled out Permit to Work workflow.\n' +
      'Trained 120+ field supervisors on hazard identification.',
    link: '',
  },
  {
    contact_id: 3,
    project: 'Pump Reliability Improvement Program',
    time_schedule: 'Jun 2019 — Dec 2020',
    company: 'PT Pertamina',
    location: 'Surabaya',
    position: 'Senior Mechanical Engineer',
    responsibility:
      'Root-cause analysis on 15 critical pumps.\n' +
      'Implemented condition-based monitoring; cut downtime 35%.',
    link: '',
  },
];

const contactsWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsRows), 'contacts');
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsExperiences), 'experiences');
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsEducation), 'education');
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsSkills), 'skills');
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsTrainings), 'trainings');
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsCertifications), 'certifications');
XLSX.utils.book_append_sheet(contactsWb, aoaSheet(contactsProjects), 'projects');
XLSX.writeFile(contactsWb, path.join(OUT_DIR, 'contacts-template.xlsx'));
console.log('Wrote', path.join(OUT_DIR, 'contacts-template.xlsx'));

// ============================================================ cv single ===

const biodataRows = [
  {
    full_name: 'Dedi Faizal',
    job_title: 'Specialist Crane Technician',
    place_of_birth: 'Jakarta',
    date_of_birth: '02 Oktober 1980',
    sex: 'Male',
    nationality: 'Indonesia',
    last_education: 'S1 Teknik Industri',
    email: 'dedi.faizal@example.com',
    phone: '+62 812 3456 7890',
    address: 'Jakarta, Indonesia',
    linkedin: 'linkedin.com/in/dedifaizal',
    website: '',
    summary:
      'Crane technician with 15+ years offshore experience across maintenance, ' +
      'inspection, and rigging operations.',
  },
];

const experiencesRows = [
  {
    role: 'Specialist Crane Technician/Operator',
    company: 'PT Elnusa Tbk',
    duration: 'Oct 2012 — Now',
    location: 'Indonesia',
    description:
      'Lead crane maintenance and operations for offshore platforms; ' +
      'mentored junior technicians; ensured compliance with HSE.',
  },
  {
    role: 'Crane Specialist, Mechanic & Maintenance',
    company: 'PT Example Two',
    duration: 'Sep 2010 — Sep 2012',
    location: 'Jakarta',
    description: 'Lattice crane inspector & scaffolding supervisor.',
  },
];

const educationRows = [
  { institution: 'Universitas UICI', degree: 'S1 Teknik Industri', year: '2026 - Now', description: '' },
  { institution: 'SMA Negeri 1 Jakarta', degree: 'Senior High School', year: '1998 - 1999', description: '' },
];

const skillsRows = [
  { name: 'Crane Operation', level: 'Expert' },
  { name: 'Hydraulics', level: 'Advanced' },
  { name: 'HSE Compliance', level: 'Expert' },
];

const trainingsRows = [
  { name: 'Sertifikat inspector Pesawat angkat angkut crane IPA MIGAS and BNSP', organizer: 'MIGAS / BNSP', year: '2020', location: 'Jakarta', description: '' },
  { name: 'Sertifikat Scaffolding Inspector BNSP', organizer: 'BNSP', year: '2019', location: 'Jakarta', description: '' },
  { name: 'Training Working at Height dan Rescue', organizer: 'Alkon', year: '2018', location: 'Bekasi', description: '' },
];

const certificationsRows = [
  { name: 'Sertifikat Asesment Crosby', issuer: 'Crosby', year: '2021' },
];

const projectsRows = [
  {
    project:
      'Fabrikasi, Instalasi Dan Pemeliharaan Konstruksi Struktur, Pipa, Dan Sipil Di Area Operasi X-Ray Di Jatibarang Field\n' +
      'Penyisihan (Segmental Partial Replacement) Main Oil Line XAP ke MGS Balongan – Offshore\n' +
      'Reaktivasi Reparator V-620 di L-PRO, Penggantian Boat Landing di TLA, TLD dan TLE di Area Operasi Offshore L-Parigi PT Pertamina EP - Subang Field',
    time_schedule: 'Oct 2012 — Now',
    company: 'PT Elnusa Tbk',
    location: 'Indonesia',
    position: 'Specialist Crane Technician/Operator',
    responsibility:
      'Perform preventive, corrective, and breakdown maintenance for offshore cranes and lifting equipment.\n' +
      'Inspect mechanical, hydraulic, pneumatic, and electrical systems to ensure operational reliability and safety.\n' +
      'Diagnose and troubleshoot crane system failures, malfunctions, and performance issues.\n' +
      'Maintain maintenance records, service reports, inspection reports, and equipment history documentation.',
    link: '',
  },
];

const cvWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(cvWb, aoaSheet(biodataRows), 'biodata');
XLSX.utils.book_append_sheet(cvWb, aoaSheet(experiencesRows), 'experiences');
XLSX.utils.book_append_sheet(cvWb, aoaSheet(educationRows), 'education');
XLSX.utils.book_append_sheet(cvWb, aoaSheet(skillsRows), 'skills');
XLSX.utils.book_append_sheet(cvWb, aoaSheet(trainingsRows), 'trainings');
XLSX.utils.book_append_sheet(cvWb, aoaSheet(certificationsRows), 'certifications');
XLSX.utils.book_append_sheet(cvWb, aoaSheet(projectsRows), 'projects');
XLSX.writeFile(cvWb, path.join(OUT_DIR, 'cv-template.xlsx'));
console.log('Wrote', path.join(OUT_DIR, 'cv-template.xlsx'));
