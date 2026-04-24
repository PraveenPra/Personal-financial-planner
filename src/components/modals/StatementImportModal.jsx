import { useMemo, useRef, useState } from 'react';
import { FileUp, LoaderCircle, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useUIStore } from '../../store/useUIStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryById } from '../../utils/categories';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getTransactionFingerprint, parseStatementPdf } from '../../utils/statementImport';

export default function StatementImportModal() {
  const { modal, closeModal } = useUIStore();
  const transactions = useFinanceStore((s) => s.transactions);
  const addTransactionsBulk = useFinanceStore((s) => s.addTransactionsBulk);
  const isOpen = modal === 'importStatement';

  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const existingFingerprints = useMemo(
    () => new Set(transactions.map((tx) => getTransactionFingerprint(tx))),
    [transactions]
  );

  const summary = useMemo(() => {
    const selected = rows.filter((row) => row.selected);
    const duplicates = rows.filter((row) => row.isDuplicate).length;
    const total = selected.reduce((sum, row) => sum + row.amount, 0);
    return { selectedCount: selected.length, duplicates, total };
  }, [rows]);

  const resetState = () => {
    setFileName('');
    setRows([]);
    setError('');
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    closeModal();
  };

  const handleFilePick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setError('');
    setRows([]);

    try {
      const { transactions: parsedTransactions } = await parseStatementPdf(file);

      if (!parsedTransactions.length) {
        setError('No transactions could be read from this PDF yet. Try a statement PDF with selectable text.');
        return;
      }

      setRows(parsedTransactions.map((tx, index) => {
        const isDuplicate = existingFingerprints.has(getTransactionFingerprint(tx));
        return {
          ...tx,
          previewId: `${tx.date}-${tx.amount}-${index}`,
          selected: !isDuplicate,
          isDuplicate,
        };
      }));
    } catch (parseError) {
      setError('Could not parse that PDF. Please try another statement file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleRowChange = (previewId, updates) => {
    setRows((current) => current.map((row) => {
      if (row.previewId !== previewId) return row;
      return { ...row, ...updates };
    }));
  };

  const handleImport = () => {
    const selectedRows = rows
      .filter((row) => row.selected)
      .map(({ previewId, selected, isDuplicate, ...transaction }) => transaction);

    if (!selectedRows.length) {
      setError('Select at least one parsed transaction to import.');
      return;
    }

    addTransactionsBulk(selectedRows);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Statement PDF"
      maxWidth={900}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            border: '1px dashed var(--border-hover)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: 'var(--blue-dim)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileUp size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Upload PhonePe or UPI statement PDF</div>
              <div className="text-sm text-secondary">We’ll read the transactions, infer categories, and let you review before import.</div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFilePick}
          />

          {fileName && (
            <div className="text-sm text-secondary" style={{ marginTop: 10 }}>
              Selected file: <span style={{ color: 'var(--text-primary)' }}>{fileName}</span>
            </div>
          )}
        </div>

        {isParsing && (
          <div className="glass-card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <LoaderCircle size={16} className="spin" />
            <span className="text-sm">Reading the PDF and matching categories...</span>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--red)', fontSize: '0.82rem', background: 'var(--red-dim)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClose}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={handleImport}>
                Import Selected Transactions
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div className="glass-card" style={{ padding: 16 }}>
                <div className="text-xs text-muted">Ready To Import</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>{summary.selectedCount}</div>
              </div>
              <div className="glass-card" style={{ padding: 16 }}>
                <div className="text-xs text-muted">Possible Duplicates</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>{summary.duplicates}</div>
              </div>
              <div className="glass-card" style={{ padding: 16 }}>
                <div className="text-xs text-muted">Selected Value</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>{formatCurrency(summary.total)}</div>
              </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Review parsed entries</div>
                  <div className="text-sm text-secondary">Categories are inferred automatically, but you can fine-tune them here.</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRows((current) => current.map((row) => ({ ...row, selected: !row.isDuplicate })))}
                  >
                    Select New
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRows((current) => current.map((row) => ({ ...row, selected: true })))}
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Import</th>
                      <th>Date</th>
                      <th>Note</th>
                      <th>Amount</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const categoryOptions = row.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                      const category = getCategoryById(row.category);
                      return (
                        <tr key={row.previewId} style={row.isDuplicate ? { opacity: 0.7 } : undefined}>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(event) => handleRowChange(row.previewId, { selected: event.target.checked })}
                              style={{ width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</td>
                          <td style={{ minWidth: 260 }}>
                            <div style={{ fontWeight: 600 }}>{row.note}</div>
                            {row.isDuplicate && <div className="text-xs text-amber mt-1">Looks like this statement row already exists.</div>}
                          </td>
                          <td style={{ color: row.type === 'income' ? 'var(--green)' : 'var(--red)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                          </td>
                          <td style={{ minWidth: 190 }}>
                            <select
                              value={row.category}
                              onChange={(event) => handleRowChange(row.previewId, { category: event.target.value })}
                            >
                              {categoryOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.icon} {option.label}
                                </option>
                              ))}
                            </select>
                            <div className="text-xs text-secondary mt-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Sparkles size={12} />
                              Suggested: {category.label}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </Modal>
  );
}
