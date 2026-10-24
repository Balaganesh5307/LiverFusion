import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AnalysisRecord } from '../../types';
import { METAVIR_STAGES } from '../../data/clinicalConstants';
import { 
  Search, 
  Trash2, 
  Eye, 
  Database, 
  RotateCcw
} from 'lucide-react';

interface HistoryTableProps {
  records: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onDeleteRecord: (id: string) => void;
  onResetDemoRecords: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onResetDemoRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const filteredRecords = records.filter((rec) => {
    const matchesSearch = 
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModality = selectedModality === 'all' || rec.modality === selectedModality;
    const matchesModel = selectedModel === 'all' || rec.model === selectedModel;
    const matchesStage = selectedStage === 'all' || rec.predictedStage === selectedStage;

    return matchesSearch && matchesModality && matchesModel && matchesStage;
  });

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Clinical Scan Analysis History</CardTitle>
              <Badge variant="warning" size="sm" className="font-mono text-[10px]">
                Demo Session Storage
              </Badge>
            </div>
            <CardDescription>
              Chronological log of analyzed ultrasound images and test batches. Data is held in client session storage in Phase 1.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetDemoRecords}
              className="text-xs"
              title="Reset sample demonstration records"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Reset Demo Records
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Modalities</option>
            <option value="ultrasound">Ultrasound (B-Mode)</option>
            <option value="ct">Computed Tomography (CT)</option>
            <option value="mri">Magnetic Resonance (MRI)</option>
          </select>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Architectures</option>
            <option value="resnet50">ResNet50 Deep Residual</option>
            <option value="cnn">Standard CNN Baseline</option>
            <option value="vit">Vision Transformer (ViT)</option>
            <option value="hybrid_fusion">Hybrid CNN-ViT Fusion</option>
          </select>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Fibrosis Stages</option>
            <option value="F0">F0 (Normal)</option>
            <option value="F1">F1 (Portal Fibrosis)</option>
            <option value="F2">F2 (Periportal)</option>
            <option value="F3">F3 (Bridging Fibrosis)</option>
            <option value="F4">F4 (Cirrhosis)</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Database className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">No records match current filter criteria</div>
            <p className="text-[11px] text-slate-400">Try adjusting your search terms or filter selections.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Analysis ID</th>
                  <th className="py-2.5 px-3">Scan Filename</th>
                  <th className="py-2.5 px-3">Modality</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Stage (Demo)</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((rec) => {
                  const stageMeta = rec.predictedStage ? METAVIR_STAGES[rec.predictedStage] : null;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        {rec.id}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={rec.fileName}>
                        {rec.fileName}
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-600">
                        {rec.modality}
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
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {rec.confidence ? (
                          <span>{(rec.confidence * 100).toFixed(1)}%</span>
                        ) : (
                          <span className="text-slate-400">—</span>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectRecord(rec)}
                            className="h-7 text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                            title="Preview analysis layout"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <button
                            onClick={() => onDeleteRecord(rec.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove demo record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div>
            Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> session records.
          </div>
          <div className="text-slate-400 font-mono text-[10px]">
            Phase 2 target: PostgreSQL / SQLite with SQLAlchemy ORM
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
