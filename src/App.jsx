import { useEffect, useMemo, useState } from 'react';
import { initialStudents } from './data/students';

const STORAGE_KEY = 'students-table-data';

const defaultForm = {
  name: '',
  email: '',
  age: '',
};

function validateStudent(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.age.toString().trim()) {
    errors.age = 'Age is required.';
  } else {
    const age = Number(values.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      errors.age = 'Enter a valid age.';
    }
  }

  return errors;
}

function buildCsv(rows) {
  const headers = ['Name', 'Email', 'Age'];
  const data = rows.map((student) => [student.name, student.email, student.age]);
  const csvRows = [headers, ...data].map((row) =>
    row
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  );

  return csvRows.join('\n');
}

function downloadCsv(rows, filename) {
  const blob = new Blob([buildCsv(rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [formValues, setFormValues] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedStudents = window.localStorage.getItem(STORAGE_KEY);
      setStudents(savedStudents ? JSON.parse(savedStudents) : initialStudents);
      setIsLoading(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!students.length && isLoading) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students, isLoading]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [student.name, student.email, student.age].some((value) =>
        String(value).toLowerCase().includes(query),
      ),
    );
  }, [students, searchTerm]);

  function resetForm() {
    setFormValues(defaultForm);
    setFormErrors({});
    setEditingId(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: name === 'age' ? value.replace(/[^\d]/g, '') : value,
    }));
    setFormErrors((current) => ({
      ...current,
      [name]: '',
    }));
  }

  function handleEdit(student) {
    setFormValues({
      name: student.name,
      email: student.email,
      age: String(student.age),
    });
    setFormErrors({});
    setEditingId(student.id);
  }

  function handleDelete(student) {
    const confirmed = window.confirm(`Delete ${student.name}?`);
    if (!confirmed) {
      return;
    }

    setStudents((current) => current.filter((item) => item.id !== student.id));
    if (editingId === student.id) {
      resetForm();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const errors = validateStudent(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      if (editingId) {
        setStudents((current) =>
          current.map((student) =>
            student.id === editingId ? { ...student, ...formValues } : student,
          ),
        );
      } else {
        setStudents((current) => [
          {
            id: Date.now(),
            ...formValues,
          },
          ...current,
        ]);
      }

      resetForm();
      setIsSubmitting(false);
    }, 500);
  }

  function exportAll() {
    downloadCsv(students, 'students-all.csv');
  }

  function exportFiltered() {
    downloadCsv(filteredStudents, 'students-filtered.csv');
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <h1>Students Table</h1>
        </div>
        <div className="hero-stats">
          <div>
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>
          <div>
            <span>Visible Rows</span>
            <strong>{filteredStudents.length}</strong>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">{editingId ? 'Edit Student' : 'Add Student'}</p>
              <h2>{editingId ? 'Update details' : 'Create a new record'}</h2>
            </div>
          </div>

          <form className="student-form" onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                name="name"
                placeholder="Enter full name"
                value={formValues.name}
                onChange={handleChange}
              />
              {formErrors.name ? <small>{formErrors.name}</small> : null}
            </label>

            <label>
              <span>Email</span>
              <input
                name="email"
                placeholder="Enter email address"
                value={formValues.email}
                onChange={handleChange}
              />
              {formErrors.email ? <small>{formErrors.email}</small> : null}
            </label>

            <label>
              <span>Age</span>
              <input
                name="age"
                placeholder="Enter age"
                value={formValues.age}
                onChange={handleChange}
                inputMode="numeric"
              />
              {formErrors.age ? <small>{formErrors.age}</small> : null}
            </label>

            <div className="form-actions">
              <button className="primary-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Student' : 'Add Student'}
              </button>
              <button className="secondary-btn" type="button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </article>

        <article className="panel table-panel">
          <div className="panel-heading responsive-heading">
            <div>
              <p className="section-label">Student Records</p>
              <h2 className="subtle-heading">Manage and export data</h2>
            </div>

            <div className="toolbar">
              <input
                className="search-input"
                placeholder="Search by name, email, or age"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button className="secondary-btn" type="button" onClick={exportFiltered}>
                Export Filtered
              </button>
              <button className="primary-btn" type="button" onClick={exportAll}>
                Export All
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading students...</p>
            </div>
          ) : filteredStudents.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Age</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.age}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="text-btn" onClick={() => handleEdit(student)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-btn danger-btn"
                            onClick={() => handleDelete(student)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No students match the current filter.</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
