const { pool } = require('../config/database');
// Server-side validation to keep contact format consistent in database.
const isValidContactNo = (value) => /^\d{10}$/.test(String(value || '').trim());

// GET /api/leads/stats
// Returns dashboard counters grouped by status for all users.
const getStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'In Progress') AS in_progress,
        SUM(status = 'Converted')   AS converted,
        SUM(status = 'Lost')        AS lost
       FROM leads`
    );
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getStats:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/leads
// Returns lead list with optional filters and search.
const getLeads = async (req, res) => {
  const { status, type, search } = req.query;
  let query = `
    SELECT
      l.*,
      u.username AS owner_name
    FROM leads l
    LEFT JOIN users u ON u.id = l.user_id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND l.status = ?';    params.push(status); }
  if (type) { query += ' AND l.lead_type = ?'; params.push(type); }
  if (search) {
    query += ' AND (l.company_name LIKE ? OR l.person_name LIKE ? OR l.contact_no LIKE ? OR u.username LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  query += ' ORDER BY l.created_at DESC';

  try {
    const [rows] = await pool.execute(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getLeads:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/leads/:id
// Returns one lead with owner name.
const getLead = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        l.*,
        u.username AS owner_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/leads
// Creates a new lead record for logged-in user.
const createLead = async (req, res) => {
  const { company_name, person_name, contact_no, contact_email, lead_type, status, description } = req.body;
  if (!company_name || !person_name || !contact_no || !lead_type)
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  if (!isValidContactNo(contact_no))
    return res.status(400).json({ success: false, message: 'Contact number must be exactly 10 digits' });

  try {
    const [result] = await pool.execute(
      `INSERT INTO leads (user_id,company_name,person_name,contact_no,contact_email,lead_type,status,description)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, company_name, person_name, contact_no,
       contact_email || null, lead_type, status || 'In Progress', description || null]
    );
    return res.status(201).json({ success: true, message: 'Lead created', leadId: result.insertId });
  } catch (err) {
    console.error('createLead:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/leads/:id
// Updates a lead only when it belongs to logged-in user.
const updateLead = async (req, res) => {
  const { company_name, person_name, contact_no, contact_email, lead_type, status, description } = req.body;
  if (!company_name || !person_name || !contact_no || !lead_type || !status)
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  if (!isValidContactNo(contact_no))
    return res.status(400).json({ success: false, message: 'Contact number must be exactly 10 digits' });
  try {
    const [result] = await pool.execute(
      `UPDATE leads SET company_name=?,person_name=?,contact_no=?,contact_email=?,
       lead_type=?,status=?,description=? WHERE id=? AND user_id=?`,
      [company_name, person_name, contact_no, contact_email || null,
       lead_type, status, description || null, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.json({ success: true, message: 'Lead updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/leads/:id
// Deletes a lead only when it belongs to logged-in user.
const deleteLead = async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM leads WHERE id=? AND user_id=?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Lead not found' });
    return res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getStats, getLeads, getLead, createLead, updateLead, deleteLead };
