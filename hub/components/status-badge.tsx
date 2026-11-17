import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  controle_ia: "Contrôle IA", en_vote: "En vote", valide: "Validé (5/5)",
  approuve: "Approuvé par le conseil", paye: "Payé", rejete: "Rejeté",
};

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    controle_ia: "border-muted text-muted-foreground",
    en_vote: "border-chart-2/40 text-chart-2",
    valide: "border-primary/40 text-primary",
    approuve: "border-success/40 text-success",
    paye: "border-success/60 bg-success/10 text-success",
    rejete: "border-destructive/40 text-destructive",
  };
  return <Badge variant="outline" className={`text-xs ${styles[status] ?? ""}`}>{STATUS_LABEL[status] ?? status}</Badge>;
}
