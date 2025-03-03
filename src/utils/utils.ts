      // Format large numbers with K/M suffix
      export const formatLargeNumber = (value: string | number): string => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if(numValue >=  1e9) {
          return (numValue / 1e9).toFixed(0) + 'B';
        } else if (numValue >= 1e6) {
          return (numValue / 1e6).toFixed(0) + 'M';
        } else if (numValue >= 1e3) {
          return (numValue / 1e3).toFixed(0) + 'K';
        } else {
          return numValue.toFixed(1);
        }
      };