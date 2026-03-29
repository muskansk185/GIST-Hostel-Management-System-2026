import React from 'react';
import { format } from 'date-fns';

interface StatusHistory {
  status: string;
  updatedAt: Date;
  updatedBy: string;
  note?: string;
}

interface Props {
  history: StatusHistory[];
}

const ComplaintTimeline: React.FC<Props> = ({ history }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Status Timeline</h3>
      <div className="relative border-l border-gray-200 ml-3">
        {history.map((item, index) => (
          <div key={index} className="mb-6 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
            </span>
            <div className="flex items-center mb-1 text-sm font-normal text-gray-500">
              <span className="text-gray-900 font-semibold mr-2">{item.status}</span>
              <span>{format(new Date(item.updatedAt), 'MMM d, yyyy HH:mm')}</span>
            </div>
            {item.note && <p className="text-sm font-normal text-gray-500">{item.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
