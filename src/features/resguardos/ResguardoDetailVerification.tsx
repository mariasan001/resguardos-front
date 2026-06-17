"use client";

import { useMemo } from "react";

import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
import { readResguardoSignature } from "@/lib/utils/resguardo-signature";

interface ResguardoDetailVerificationProps {
  resguardoId: number;
  titular: string;
  titularEmail?: string;
}

export default function ResguardoDetailVerification({
  resguardoId,
  titular,
  titularEmail,
}: ResguardoDetailVerificationProps) {
  const signatureDataUrl = useMemo(
    () => readResguardoSignature(resguardoId) ?? undefined,
    [resguardoId],
  );

  return (
    <ResguardoVerificationCard
      titular={titular}
      titularEmail={titularEmail}
      initialSignatureDataUrl={signatureDataUrl}
      initialSignatureValidated={Boolean(signatureDataUrl)}
      readOnly
    />
  );
}
