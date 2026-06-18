"use client";

import { useEffect, useState } from "react";

import ResguardoVerificationCard from "@/features/resguardos/ResguardoVerificationCard";
import { ApiError } from "@/lib/api/errors";
import { getResguardoFirma } from "@/lib/services/resguardos.service";
import { blobToDataUrl } from "@/lib/utils/file";

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
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function loadSignature() {
      try {
        const blob = await getResguardoFirma(resguardoId);
        const dataUrl = await blobToDataUrl(blob);

        if (!cancelled) {
          setSignatureDataUrl(dataUrl);
        }
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 404 || error.status === 410)
        ) {
          if (!cancelled) {
            setSignatureDataUrl(undefined);
          }

          return;
        }

        if (!cancelled) {
          setSignatureDataUrl(undefined);
        }
      }
    }

    void loadSignature();

    return () => {
      cancelled = true;
    };
  }, [resguardoId]);

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
