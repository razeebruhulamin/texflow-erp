import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageRepository } from '../../services/storage';
import { PageHeader } from '../../components/common/PageHeader';
import { History, ShieldCheck, Clock } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { currentOrg, dataVersion } = useApp();
  const orgId = currentOrg?.id || '';

  const logs = useMemo(() => StorageRepository.getAuditLogs(orgId), [orgId, dataVersion]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail & Activity Log"
        subtitle="Immutable transaction history recording financial postings, goods receipts, production completion, and user activities."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Module</th>
                <th className="p-3">Activity Details</th>
                <th className="p-3">User / Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-teal-700 capitalize">
                      {log.module.toLowerCase().replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-slate-700 max-w-md">{log.details}</td>
                    <td className="p-3 font-medium text-slate-900">{log.performedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
