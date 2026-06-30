"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Lightbulb, AlertTriangle, RefreshCw, Send } from "lucide-react";
import toast from "react-hot-toast";

interface Insight {
  type: "insight" | "alert" | "recommendation";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
}

export default function AIPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function loadInsights(type = "weekly") {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/insights?type=${type}`);
      const d = await res.json();
      if (d.success) {
        setAvailable(d.data.available);
        setInsights(d.data.insights || []);
      }
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInsights(); }, []);

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      const d = await res.json();
      if (d.success) setChatResponse(d.data.response);
    } catch {
      toast.error("Failed to get response");
    } finally {
      setChatLoading(false);
    }
  }

  if (!available) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">AI-powered workforce analytics</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">AI Features Locked</h3>
            <p className="text-muted-foreground mb-4">AI features are available on the Enterprise plan.</p>
            <Button asChild><a href="/billing">Upgrade to Enterprise</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">Intelligent workforce analytics and recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadInsights("daily")}>Daily</Button>
          <Button variant="outline" size="sm" onClick={() => loadInsights("weekly")}>Weekly</Button>
          <Button variant="outline" size="sm" onClick={() => loadInsights("monthly")}>Monthly</Button>
          <Button variant="ghost" size="icon" onClick={() => loadInsights()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="text-center py-8">Analyzing data...</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {insight.type === "insight" && <Lightbulb className="h-4 w-4 text-blue-500" />}
                  {insight.type === "alert" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  {insight.type === "recommendation" && <Brain className="h-4 w-4 text-purple-500" />}
                  {insight.title}
                </CardTitle>
                {insight.severity && (
                  <Badge variant={insight.severity === "high" ? "destructive" : "warning"}>
                    {insight.severity}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>AI HR Assistant</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleChat} className="flex gap-2">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask about HR policies, attendance trends, or recommendations..."
            />
            <Button type="submit" disabled={chatLoading}>
              {chatLoading ? "..." : <Send className="h-4 w-4" />}
            </Button>
          </form>
          {chatResponse && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm">{chatResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
