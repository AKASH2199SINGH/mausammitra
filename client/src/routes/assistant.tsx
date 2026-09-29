import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mic } from "lucide-react";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { AdvisoryPanel } from "@/components/dashboard/AdvisoryPanel";
import { Panel, PanelHeader } from "@/components/common/primitives";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Weather Assistant — MausamMitra" },
      {
        name: "description",
        content:
          "Ask about rainfall, travel safety, irrigation timing or an active warning and get grounded answers with source, timestamp and confidence.",
      },
      { property: "og:title", content: "AI Weather Assistant — MausamMitra" },
      {
        property: "og:description",
        content:
          "Conversational hazard advisory in Hindi and English, separating official warnings from MausamMitra advisories.",
      },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const { mode, locationId, openVoice, language } = useAppState();
  const advisory = useQuery({
    queryKey: queryKeys.advisory(mode, locationId),
    queryFn: () => mausamApi.getAdvisory(mode, locationId),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide">AI weather assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every answer is grounded on the live observation and warning feeds, and labelled with its
          source, issue time, validity and confidence.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <AssistantChat className="min-h-[620px]" />

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Voice interaction" sub="Hindi / English · mock ASR + TTS" />
            <div className="space-y-3 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Speak your question instead of typing. The prototype simulates the full pipeline:
                listening, transcription, grounded reasoning, then a spoken reply in{" "}
                {language === "hi" ? "हिन्दी" : "English"}.
              </p>
              <button
                type="button"
                onClick={openVoice}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/15 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/25"
              >
                <Mic className="h-4 w-4" strokeWidth={2} />
                Start voice session
              </button>
            </div>
          </Panel>

          <AdvisoryPanel advisory={advisory.data} />
        </div>
      </div>
    </div>
  );
}
