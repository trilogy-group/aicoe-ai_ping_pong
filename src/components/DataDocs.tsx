import React from "react";
import ReactMarkdown from "react-markdown";

// Import README markdown (raw)
// @ts-ignore – vite `?raw` import
import readmeText from "../../data/README.md?raw";

// Import CSVs (raw)
// @ts-ignore
import timeCsv from "../../data/time_efficiency.csv?raw";
// @ts-ignore
import degradationCsv from "../../data/quality_degradation.csv?raw";
// @ts-ignore
import strengthsCsv from "../../data/model_strengths.csv?raw";
// @ts-ignore
import freeTierCsv from "../../data/free_tier_accuracy.csv?raw";
// @ts-ignore
import roiCsv from "../../data/roi_calculation.csv?raw";
// @ts-ignore
import qualityCsv from "../../data/quality_metrics.csv?raw";
// @ts-ignore
import experimentCsv from "../../data/experiment_summary.csv?raw";
// @ts-ignore
import revisionCsv from "../../data/revision_cycles.csv?raw";
// @ts-ignore
import productivityCsv from "../../data/productivity_growth.csv?raw";

const csvMap: { name: string; raw: string }[] = [
  { name: "time_efficiency.csv", raw: timeCsv },
  { name: "quality_degradation.csv", raw: degradationCsv },
  { name: "model_strengths.csv", raw: strengthsCsv },
  { name: "free_tier_accuracy.csv", raw: freeTierCsv },
  { name: "roi_calculation.csv", raw: roiCsv },
  { name: "quality_metrics.csv", raw: qualityCsv },
  { name: "experiment_summary.csv", raw: experimentCsv },
  { name: "revision_cycles.csv", raw: revisionCsv },
  { name: "productivity_growth.csv", raw: productivityCsv },
];

// Basic CSV parser – returns header array + all row arrays
const parseCsv = (csv: string) => {
  const lines = csv.trim().split(/\r?\n/);
  const [headerLine, ...rowLines] = lines;
  const headers = headerLine.split(",");
  const rows = rowLines.map((ln) => ln.split(","));
  return { headers, rows, total: rows.length };
};

const DataDocs: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white relative overflow-x-hidden pb-20">
      <main className="pt-10 flex justify-center px-4">
        <div
          className="w-full max-w-4xl bg-[#141414] border border-gray-800 rounded-lg shadow-lg p-8 md:p-10 space-y-10"
          style={{
            boxShadow:
              "0 4px 20px rgba(0, 255, 191, 0.07), 0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {/* README Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📑 README</h2>
            <article className="prose prose-invert max-w-none text-sm">
              <ReactMarkdown>{readmeText}</ReactMarkdown>
            </article>
          </section>

          {/* CSV Previews */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📊 CSVs</h2>
            <div className="space-y-8">
              {csvMap.map(({ name, raw }) => {
                const { headers, rows, total } = parseCsv(raw);
                return (
                  <div key={name} className="border border-gray-700 rounded-lg">
                    <header className="bg-gray-800 px-4 py-2 text-sm font-semibold flex items-center justify-between">
                      <span>{name}</span>
                      <a
                        href={`/data/${name}`}
                        download
                        className="text-xs underline text-gray-300 hover:text-white"
                      >
                        Download
                      </a>
                    </header>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-900">
                          <tr>
                            {headers.map((h) => (
                              <th
                                key={h}
                                className="px-2 py-1 font-medium border-r border-gray-800"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0
                                  ? "bg-gray-800/30"
                                  : "bg-gray-800/10"
                              }
                            >
                              {row.map((cell, cid) => (
                                <td
                                  key={cid}
                                  className="px-2 py-1 border-r border-gray-800"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 px-4 py-1">
                      {total} rows
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DataDocs;
