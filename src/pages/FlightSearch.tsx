/**
 * Flight Search Page
 * Dedicated page for live flight search functionality
 */
import React from 'react';
import { FlightSearch as FlightSearchComponent } from '@/components/FlightSearch';

export default function FlightSearch() {
  return (
    <div className="container mx-auto py-6 px-4">
      <FlightSearchComponent />
    </div>
  );
}
