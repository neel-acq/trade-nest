'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/trading/page-header';
import { Panel } from '@/components/trading/panel';
import { importStocksCsv } from '@/lib/stocks';
import { ApiError } from '@/lib/api';

const SAMPLE_CSV = `symbol,companyName,currentPrice,currentVolume
DEMO1,Demo Stock One Ltd,125.50,750000
DEMO2,Demo Stock Two Ltd,89.25,1200000`;

export default function AdminStocksImportPage() {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importStocksCsv(csv);
      setResult(
        `Created: ${res.created}, Skipped: ${res.skipped}${res.errors.length ? `, Errors: ${res.errors.join('; ')}` : ''}`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Import Stocks"
        description="Bulk import equities via CSV — symbol, companyName, currentPrice, currentVolume"
      />

      <Panel title="CSV Upload">
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
          />

          <textarea
            className="w-full h-48 rounded-md border border-input bg-background p-3 font-mono text-sm"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && <p className="text-sm text-gain">{result}</p>}

          <Button onClick={handleImport} disabled={loading}>
            {loading ? 'Importing...' : 'Import CSV'}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
