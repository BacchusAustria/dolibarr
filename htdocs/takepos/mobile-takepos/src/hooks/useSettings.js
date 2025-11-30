// src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import { api } from '../api';

/**
 * Ein React Hook zur Verwaltung globaler App-Einstellungen.
 * Stellt die Unternehmensinformationen für den Belegdruck bereit.
 */
export function useSettings(apiKey) {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    async function fetchCompanyInfo() {
      if (!apiKey || apiKey === 'undefined') {
        setDataError(new Error("API key is not provided. Cannot fetch settings."));
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        // Zukünftige Implementierung: API-Aufruf, um die Firmeninfos zu laden.
        // const info = await api.fetchCompanyInfo(apiKey);
        // setCompanyInfo(info);

        // Derzeit gibt es keinen API-Endpunkt, daher wird der Hook eine Warnung ausgeben.
        setDataError(new Error("Company settings could not be loaded. API endpoint not implemented."));

      } catch (error) {
        console.error('Fehler beim Laden der Unternehmensinformationen:', error);
        setDataError(error);
        setCompanyInfo(null);
      } finally {
        setDataLoading(false);
      }
    }

    fetchCompanyInfo();
  }, [apiKey]);

  return { companyInfo, dataLoading, dataError };
}