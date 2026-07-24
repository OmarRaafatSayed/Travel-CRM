import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, Network } from "lucide-react";

export default function MindmapPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Mind Map</h1>
        <p className="text-muted-foreground">AI-powered mind mapping feature coming soon</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Smart Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Create intelligent mind maps with AI assistance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Network className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Visual Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Visualize relationships between ideas and concepts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <CardTitle className="text-lg">Real-time Collaboration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Collaborate with your team in real-time
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}