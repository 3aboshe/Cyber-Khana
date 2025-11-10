import React, { useState } from 'react';
import Card from './ui/EnhancedCard';
import { Info, TrendingDown, Calculator } from 'lucide-react';
import { getPointDecreaseInfo } from '../utils/decayCalculator';
import Button from './ui/EnhancedButton';

interface PointDecayInfoProps {
  challenge: any;
  user?: any;
}

const PointDecayInfo: React.FC<PointDecayInfoProps> = ({ challenge, user }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!challenge) return null;

  // Only show to admins and super-admins
  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return null;
  }

  const initialPoints = challenge.initialPoints || 1000;
  const minimumPoints = challenge.minimumPoints || 100;
  const decay = challenge.decay || 200;
  const solves = challenge.solves || 0;

  const info = getPointDecreaseInfo(solves, initialPoints, minimumPoints, decay);

  return (
    <Card padding="md" className="mt-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-zinc-200 font-semibold mb-2">Point Decay System</h3>
          <p className="text-zinc-400 text-sm mb-3">
            Challenge points start at <span className="text-emerald-400 font-semibold">{initialPoints}</span> and decrease as more people solve it.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-zinc-400 text-xs mb-1">Current Points</p>
              <p className="text-2xl font-bold text-emerald-400">{info.currentPoints}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-zinc-400 text-xs mb-1">Total Decrease</p>
              <p className="text-2xl font-bold text-red-400">{info.decrease}</p>
            </div>
          </div>

          {info.nextDecreaseAmount > 0 && (
            <p className="text-zinc-400 text-sm">
              Next decrease at <span className="text-zinc-300 font-semibold">{info.nextDecreaseAt} solves</span>:
              <span className="text-red-400 font-semibold"> -{info.nextDecreaseAmount} points</span>
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            leftIcon={<Calculator className="w-4 h-4" />}
            className="mt-3"
          >
            {showDetails ? 'Hide' : 'Show'} Decay Formula
          </Button>

          {showDetails && (
            <div className="mt-4 p-4 bg-zinc-800/70 rounded-lg border border-zinc-700">
              <h4 className="text-zinc-200 font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Decay Formula
              </h4>
              <div className="text-zinc-300 text-sm font-mono bg-zinc-900/50 p-3 rounded border border-zinc-700">
                <p className="mb-2">currentPoints = Math.ceil(((minimum - initial) / decay²) × solves² + initial)</p>
                <p className="text-zinc-500 text-xs">
                  Where: initial={initialPoints}, minimum={minimumPoints}, decay={decay}, solves={solves}
                </p>
              </div>

              <div className="mt-4">
                <h5 className="text-zinc-200 font-medium mb-2">Decay Progression:</h5>
                <div className="space-y-1 text-xs text-zinc-400 font-mono">
                  <p>0 solves → 1000 points</p>
                  <p>5 solves → 985 points (-15)</p>
                  <p>10 solves → 960 points (-40)</p>
                  <p>20 solves → 883 points (-117)</p>
                  <p>30 solves → 771 points (-229)</p>
                  <p>40 solves → 625 points (-375)</p>
                  <p>50 solves → 444 points (-556)</p>
                  <p className="text-zinc-500">66+ solves → 100 points (minimum)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PointDecayInfo;
