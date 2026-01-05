
import React, { useState, useCallback } from 'react';
import { LinkedInConnection, TreeNode, NetworkSummary } from './types';
import TreeVisualizer from './components/TreeVisualizer';
import StatsDashboard from './components/StatsDashboard';
import { getNetworkInsights } from './services/geminiService';

const App: React.FC = () => {
  const [connections, setConnections] = useState<LinkedInConnection[]>([]);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const parseCSV = (text: string): LinkedInConnection[] => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const headerIndex = rows.findIndex(r => r.includes('First Name'));
    if (headerIndex === -1) return [];

    const headers = rows[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = rows.slice(headerIndex + 1);

    return dataRows.map(row => {
      const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
      
      const connection: any = {};
      headers.forEach((header, i) => {
        const key = header.toLowerCase().replace(/\s/g, '');
        if (key.includes('firstname')) connection.firstName = cleanValues[i];
        if (key.includes('lastname')) connection.lastName = cleanValues[i];
        if (key.includes('company')) connection.company = cleanValues[i];
        if (key.includes('position') || key.includes('occupation')) connection.position = cleanValues[i];
        if (key.includes('connectedon')) connection.connectedOn = cleanValues[i];
        if (key.includes('url')) connection.url = cleanValues[i];
        if (key.includes('email')) connection.email = cleanValues[i];
      });
      return connection as LinkedInConnection;
    }).filter(c => c.company);
  };

  const processData = useCallback(async (connections: LinkedInConnection[]) => {
    setIsProcessing(true);
    
    const companies: Record<string, LinkedInConnection[]> = {};
    connections.forEach(c => {
      if (!companies[c.company]) companies[c.company] = [];
      companies[c.company].push(c);
    });

    const root: TreeNode = {
      name: "My Network",
      type: 'root',
      children: Object.entries(companies)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 80) // Slightly more nodes for wide viewing
        .map(([name, group]) => ({
          name,
          type: 'company' as const,
          children: group.map(conn => ({
            name: `${conn.firstName} ${conn.lastName}`,
            type: 'contact' as const,
            info: conn
          }))
        }))
    };

    const stats: NetworkSummary = {
      totalConnections: connections.length,
      totalCompanies: Object.keys(companies).length,
      topCompanies: Object.entries(companies)
        .map(([name, list]) => ({ name, count: list.length }))
        .sort((a, b) => b.count - a.count)
    };

    setTreeData(root);
    setSummary(stats);
    setIsProcessing(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setConnections(parsed);
      processData(parsed);
    };
    reader.readAsText(file);
  };

  const generateAIInsights = async () => {
    if (connections.length === 0) return;
    setIsGeneratingInsights(true);
    const insights = await getNetworkInsights(connections);
    setAiInsights(insights);
    setIsGeneratingInsights(false);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded text-white shadow-lg shadow-blue-900/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">NetMapper</h1>
          </div>
          <div className="flex items-center gap-4">
             {connections.length > 0 && (
               <button 
                onClick={() => { setConnections([]); setTreeData(null); setSummary(null); setAiInsights(''); }}
                className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
               >
                 Reset
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {!treeData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
            <div className="bg-slate-800 p-10 rounded-full mb-8 border border-slate-700 shadow-2xl">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4">Visualize Your Professional Network</h2>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed">
              Upload your LinkedIn <span className="font-mono text-sm bg-slate-800 text-blue-400 px-2 py-1 rounded border border-slate-700">Connections.csv</span> to explore 
              an interactive company tree and generate professional insights with Gemini AI.
            </p>
            
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full mb-8">
              <label className="flex flex-col items-center gap-6 cursor-pointer group">
                <div className="bg-blue-600 group-hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold transition-all shadow-xl hover:shadow-blue-900/40 transform hover:-translate-y-1">
                  Upload Connections.csv
                </div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                <span className="text-xs text-slate-500">Your privacy matters: data is processed locally in your browser.</span>
              </label>
            </div>

            <div className="text-left bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full">
              <h3 className="font-bold text-slate-300 mb-3 uppercase text-xs tracking-widest">How to export your data</h3>
              <ol className="text-sm text-slate-400 space-y-3 list-decimal ml-5">
                <li>Visit <a href="https://www.linkedin.com/psettings/member-data" target="_blank" className="text-blue-400 hover:underline">LinkedIn Data Privacy</a>.</li>
                <li>Select "Get a copy of your data" and check "Connections".</li>
                <li>Request archive. Download the CSV from the link sent to your email.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">Your Professional Map</h2>
                <p className="text-slate-400">Analyzing {connections.length} connections across {summary?.totalCompanies} companies.</p>
              </div>
              <button 
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-900/50 transition-all disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isGeneratingInsights ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Network...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    AI Insights
                  </>
                )}
              </button>
            </div>

            {summary && <StatsDashboard summary={summary} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-100 text-lg">Interactive Connection Tree</h3>
                    <div className="flex gap-4">
                       <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Root</span>
                       <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-blue-700"></div> Company</span>
                       <span className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600"></div> Person</span>
                    </div>
                  </div>
                  <TreeVisualizer data={treeData} onNodeClick={setSelectedNode} />
                </div>
              </div>

              <div className="space-y-6">
                {/* AI Insights Card */}
                {aiInsights && (
                  <div className="bg-gradient-to-br from-blue-900/40 to-slate-800 rounded-3xl shadow-2xl border border-blue-800/30 p-8 animate-in slide-in-from-right-4 duration-500">
                    <h3 className="font-bold text-blue-300 mb-5 flex items-center gap-3 text-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      AI Network Intelligence
                    </h3>
                    <div className="prose prose-invert prose-sm text-slate-300 overflow-y-auto max-h-[450px] no-scrollbar space-y-3 leading-relaxed">
                      {aiInsights.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('#') ? 'font-bold text-blue-200 mt-4' : ''}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Detail Card */}
                <div className="bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8 sticky top-24">
                  <h3 className="font-bold text-slate-100 mb-6 text-lg">Node Information</h3>
                  {selectedNode ? (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      {selectedNode.type === 'contact' && selectedNode.info ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-900/50 rounded-2xl border border-blue-700/30 flex items-center justify-center text-blue-400 font-extrabold text-xl">
                              {selectedNode.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white text-lg leading-tight">{selectedNode.name}</p>
                              <p className="text-sm text-slate-400 mt-1">{selectedNode.info.position}</p>
                            </div>
                          </div>
                          <div className="space-y-4 pt-4 border-t border-slate-700">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Company</span>
                              <span className="font-medium text-slate-200">{selectedNode.info.company}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Connected</span>
                              <span className="font-medium text-slate-200">{selectedNode.info.connectedOn}</span>
                            </div>
                            {selectedNode.info.url && (
                              <a href={selectedNode.info.url} target="_blank" className="block text-center mt-6 bg-slate-700/50 hover:bg-slate-700 text-blue-400 font-bold border border-slate-600 rounded-xl py-3 transition-all hover:scale-[1.02]">
                                View Profile
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-white text-xl">{selectedNode.name}</p>
                          <p className="text-sm text-blue-400 mt-2 font-mono uppercase tracking-widest">{selectedNode.type}</p>
                          <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                            <p className="text-sm text-slate-400 leading-relaxed italic">
                              This branch contains <span className="text-blue-400 font-bold">{selectedNode.children?.length || 0}</span> direct connections.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      <p className="text-sm">Select a node on the map to see details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-slate-900/80 backdrop-blur-md border-t border-slate-800 py-4 block md:hidden z-[100]">
        <div className="flex justify-center">
            {treeData && (
              <label className="bg-blue-600 text-white px-10 py-3 rounded-full font-bold shadow-xl shadow-blue-900/40">
                New Upload
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
        </div>
      </footer>
    </div>
  );
};

export default App;
