import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AnalysisRecord, NavigationTab } from '../../types';
import { ArrowUpRight, FileText } from 'lucide-react';
import { METAVIR_STAGES } from '../../data/clinicalConstants';

interface RecentActivityTableProps {
  records: AnalysisRecord[];
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectRecordForView: (record: AnalysisRecord) => void;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  records,
  onNavigateTab,
  onSelectRecordForView,
}) => {
  return (
    <Card className="border-slate-200/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Recent Analysis Activity</CardTitle>
              <Badge variant="warning" size="sm" className="font-mono text-[10px]">
                Demo Session Records
              </Badge>
            </div>
            <CardDescription>
              Recent scan submissions and preprocessing activity. Persisted to session storage in Phase 1.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab('history')}
            className="text-xs"
          >
            <span>View All History</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Scan ID</th>
                <th className="py-2.5 px-3">Image Filename</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-3">Model Target</th>
                <th className="py-2.5 px-3">Stage (Demo)</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {records.slice(0, 5).map((rec) => {
                const stageMeta = rec.predictedStage ? METAVIR_STAGES[rec.predictedStage] : null;
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {rec.id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={rec.fileName}>
                      {rec.fileName}
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${rec.modality === 'ultrasound' ? 'bg-teal-500' : 'bg-blue-500'}`} />
                        {rec.modality}
                      </span>
                    </td>
                    <td className="py-3 px-3 uppercase font-mono text-[11px] text-slate-600">
                      {rec.model === 'resnet50' ? 'ResNet50' : rec.model === 'cnn' ? 'CNN' : rec.model === 'vit' ? 'ViT' : 'Hybrid'}
                    </td>
                    <td className="py-3 px-3">
                      {stageMeta ? (
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${stageMeta.color.bg} ${stageMeta.color.text} border ${stageMeta.color.border}`}>
                          {stageMeta.stage}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {rec.createdAt}
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          rec.status.includes('Completed') ? 'teal' :
                          rec.status.includes('Pending') ? 'warning' : 'outline'
                        }
                        size="sm"
                      >
                        {rec.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectRecordForView(rec)}
                        className="h-7 text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
