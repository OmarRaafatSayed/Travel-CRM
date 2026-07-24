import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Column, 
  Line, 
  Pie, 
  Area, 
  Bar,
  Funnel
} from '@ant-design/charts';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Download,
  Maximize2
} from "lucide-react";

interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'funnel';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  data: any[];
  insights?: string[];
  recommendations?: string[];
}

interface InteractiveChartProps {
  chartData: ChartData;
  className?: string;
}

export function InteractiveChart({ chartData, className }: InteractiveChartProps) {
  const { chartType, title, data, insights, recommendations } = chartData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'line': return <LineChart className="w-4 h-4" />;
      case 'pie': return <PieChart className="w-4 h-4" />;
      case 'area': return <TrendingUp className="w-4 h-4" />;
      case 'funnel': return <BarChart3 className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getChartConfig = () => {
    const baseConfig = {
      data,
      height: 300,
      autoFit: true,
    };

    switch (chartType) {
      case 'bar':
        return {
          ...baseConfig,
          xField: Object.keys(data[0] || {})[0],
          yField: Object.keys(data[0] || {})[1],
          color: '#0ea5e9',
          columnStyle: {
            radius: [4, 4, 0, 0],
          },
          label: {
            position: 'top' as const,
            formatter: (datum: any) => {
              const value = Object.values(datum)[1] as number;
              return typeof value === 'number' && value > 1000 ? formatCurrency(value) : value?.toString();
            },
          },
        };

      case 'line':
        return {
          ...baseConfig,
          xField: Object.keys(data[0] || {})[0],
          yField: Object.keys(data[0] || {})[1],
          color: '#0ea5e9',
          smooth: true,
          point: {
            size: 5,
            shape: 'diamond',
          },
        };

      case 'pie':
        return {
          ...baseConfig,
          angleField: Object.keys(data[0] || {})[1],
          colorField: Object.keys(data[0] || {})[0],
          radius: 0.8,
          color: ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
          label: {
            type: 'outer',
            content: '{name}: {percentage}%',
          },
          legend: {
            position: 'bottom' as const,
          },
        };

      case 'area':
        return {
          ...baseConfig,
          xField: Object.keys(data[0] || {})[0],
          yField: Object.keys(data[0] || {})[1],
          color: '#10b981',
          areaStyle: {
            fill: 'l(270) 0:#10b981 0.5:#10b98150 1:#10b98110',
          },
        };

      case 'funnel':
        return {
          ...baseConfig,
          xField: Object.keys(data[0] || {})[0],
          yField: Object.keys(data[0] || {})[1],
          color: ['#0ea5e9', '#06b6d4', '#0891b2', '#10b981'],
          label: {
            formatter: (datum: any) => {
              const value = Object.values(datum)[1] as number;
              return typeof value === 'number' && value > 1000 ? formatCurrency(value) : value?.toString();
            },
          },
        };

      default:
        return baseConfig;
    }
  };

  const renderChart = () => {
    const config = getChartConfig();
    
    switch (chartType) {
      case 'bar':
        return <Column {...config} />;
      case 'line':
        return <Line {...config} />;
      case 'pie':
        return <Pie {...config} />;
      case 'area':
        return <Area {...config} />;
      case 'funnel':
        return <Funnel {...config} />;
      default:
        return <Column {...config} />;
    }
  };

  const exportChart = () => {
    // This would implement chart export functionality
    console.log('Exporting chart...', chartData);
  };

  const expandChart = () => {
    // This would implement chart expansion functionality
    console.log('Expanding chart...', chartData);
  };

  return (
    <Card className={`mt-4 bg-card border border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            {getChartIcon()}
            {title}
            <Badge variant="outline" className="text-xs border-border">
              {chartType.toUpperCase()}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportChart} className="border-border hover:bg-accent">
              <Download className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={expandChart} className="border-border hover:bg-accent">
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          {renderChart()}
        </div>
        
        {/* Data Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-border">
            <div className="font-bold text-blue-600 dark:text-blue-400">{data.length}</div>
            <div className="text-xs text-blue-500 dark:text-blue-400">Data Points</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded border border-border">
            <div className="font-bold text-green-600 dark:text-green-400">
              {data.reduce((sum, item) => {
                const value = Object.values(item)[1] as number;
                return sum + (typeof value === 'number' ? value : 0);
              }, 0).toLocaleString()}
            </div>
            <div className="text-xs text-green-500 dark:text-green-400">Total Value</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-border">
            <div className="font-bold text-purple-600 dark:text-purple-400">
              {Math.max(...data.map(item => Object.values(item)[1] as number)).toLocaleString()}
            </div>
            <div className="text-xs text-purple-500 dark:text-purple-400">Max Value</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-border">
            <div className="font-bold text-orange-600 dark:text-orange-400">
              {Math.round(data.reduce((sum, item) => {
                const value = Object.values(item)[1] as number;
                return sum + (typeof value === 'number' ? value : 0);
              }, 0) / data.length).toLocaleString()}
            </div>
            <div className="text-xs text-orange-500 dark:text-orange-400">Average</div>
          </div>
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground">
              <TrendingUp className="w-4 h-4" />
              Key Insights
            </h4>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-foreground">Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}