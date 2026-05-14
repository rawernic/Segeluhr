import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type RegattaStartTime = {
  id: string;
  label: string;
  hour: number;
  minute: number;
  second: number;
};

const REGATTA_START_TIMES: RegattaStartTime[] = [
  { id: 'start-1', label: '30 - 18:40:12', hour: 18, minute: 40, second: 12 },
  { id: 'start-2', label: '35 - 18:41:54', hour: 18, minute: 41, second: 54 },
  { id: 'start-3', label: '40 - 18:43:36', hour: 18, minute: 43, second: 36 },
  { id: 'start-4', label: '45 - 18:45:18', hour: 18, minute: 45, second: 18 },
  { id: 'start-5', label: '50 - 18:47:00', hour: 18, minute: 47, second: 0 },
];


function getTimestampForToday(hour: number, minute: number, second: number): number {
  const d = new Date();
  d.setHours(hour, minute, second, 0);
  return d.getTime();
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(Math.abs(totalSeconds) / 60);
  const seconds = Math.abs(totalSeconds) % 60;
  const sign = totalSeconds < 0 ? '-' : '';
  return `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatClockTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getAnnouncement(previousSeconds: number, currentSeconds: number): string | null {
  if (currentSeconds === previousSeconds) {
    return null;
  }

  if (currentSeconds <= 0) {
    return 'Start!';
  }

  if (currentSeconds <= 60) {
    for (const threshold of [60, 50, 40, 35, 30, 25, 20, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]) {
      if (previousSeconds > threshold && currentSeconds <= threshold) {
        return `${threshold}!`;
      }
    }
    return null;
  }
  
  const previousMinutes = Math.ceil(previousSeconds / 60);
  const currentMinutes = Math.ceil(currentSeconds / 60);

  if (currentSeconds <= 180) {
    for (const threshold of [150, 90]) {
      if (previousSeconds > threshold && currentSeconds <= threshold) {
        const minutes = currentMinutes -1;
        return `Noch ${minutes} Minuten 30!`;
      }
    }
  }

  if (previousMinutes > currentMinutes && currentMinutes < 15) {
    return `Noch ${currentMinutes} Minuten!`;
  }

  return null;
}

export default function App() {
  const [clockTime, setClockTime] = useState<Date>(new Date());
  const [activeStartId, setActiveStartId] = useState<string | null>(null);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<string>('2');
  const [customSeconds, setCustomSeconds] = useState<string>('0');
  const [offsetSeconds, setOffsetSeconds] = useState<number>(0);

  const activeStart = useMemo(
    () => REGATTA_START_TIMES.find((item) => item.id === activeStartId) ?? null,
    [activeStartId],
  );

  // Live clock — always ticking
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (targetTimestamp === null) {
      return;
    }

    const interval = setInterval(() => {
      const nextSeconds = Math.ceil((targetTimestamp - Date.now()) / 1000);

      if (nextSeconds <= 0) {
        clearInterval(interval);
      }

      setRemainingSeconds((previousSeconds: number) => {
        const announcement = getAnnouncement(previousSeconds, nextSeconds);
        if (announcement) {
          Speech.speak(announcement, { language: 'de-DE' });
        }
        return nextSeconds;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetTimestamp]);

  const handleStart = (start: RegattaStartTime) => {
    const target = getTimestampForToday(start.hour, start.minute, start.second);
    const initialSeconds = Math.ceil((target - Date.now()) / 1000);
    setActiveStartId(start.id);
    setRemainingSeconds(initialSeconds);
    setTargetTimestamp(target);
  };

  const handleCustomStart = () => {
    const minutes = Math.max(0, parseInt(customMinutes, 10) || 0);
    const seconds = Math.max(0, parseInt(customSeconds, 10) || 0);
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      return;
    }
    const target = Date.now() + totalSeconds * 1000;
    setActiveStartId(null);
    setRemainingSeconds(totalSeconds);
    setTargetTimestamp(target);
  };

  const handleOffsetPlus = () => {
    setOffsetSeconds((prev) => prev + 1);
    setTargetTimestamp((prev) => (prev !== null ? prev + 1000 : prev));
  };

  const handleOffsetMinus = () => {
    setOffsetSeconds((prev) => prev - 1);
    setTargetTimestamp((prev) => (prev !== null ? prev - 1000 : prev));
  };

  const handleReset = () => {
    setTargetTimestamp(null);
    setActiveStartId(null);
    setRemainingSeconds(0);
    Speech.stop();
  };

  const isRunning = targetTimestamp !== null && remainingSeconds > 0;
  const isFinished = targetTimestamp !== null && remainingSeconds <= 0;

  const offsetClockTime = new Date(clockTime.getTime() + offsetSeconds * 1000);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Känguruh Timer</Text>
        <View style={styles.clockRow}>
          {!isRunning && (
            <Pressable style={styles.offsetButton} onPress={handleOffsetMinus}>
              <Text style={styles.offsetButtonLabel}>−</Text>
            </Pressable>
          )}
          <Text style={styles.clock}>{formatClockTime(offsetClockTime)}</Text>
          {!isRunning && (
            <Pressable style={styles.offsetButton} onPress={handleOffsetPlus}>
              <Text style={styles.offsetButtonLabel}>+</Text>
            </Pressable>
          )}
        </View>
        {!isRunning && offsetSeconds !== 0 && (
          <Text style={styles.offsetLabel}>
            Offset: {offsetSeconds > 0 ? '+' : ''}{offsetSeconds}s
          </Text>
        )}
      </View>
      {!isRunning && !isFinished ? (
        <View style={styles.selectionContainer}>
          <Text style={styles.subtitle}>Regatta-Startzeit wählen</Text>
          {REGATTA_START_TIMES.map((start) => (
            <Pressable key={start.id} style={styles.button} onPress={() => handleStart(start)}>
              <Text style={styles.buttonLabel}>{start.label}</Text>
            </Pressable>
          ))}
          <Text style={[styles.subtitle, styles.customTitle]}>Freier Countdown</Text>
          <View style={styles.customRow}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={customMinutes}
              onChangeText={(text) => setCustomMinutes(text.replace(/[^0-9]/g, ''))}
              maxLength={3}
              placeholder="Min"
            />
            <Text style={styles.customSeparator}>:</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={customSeconds}
              onChangeText={(text) => setCustomSeconds(text.replace(/[^0-9]/g, ''))}
              maxLength={2}
              placeholder="Sek"
            />
          </View>
          <Pressable style={styles.button} onPress={handleCustomStart}>
            <Text style={styles.buttonLabel}>Countdown starten</Text>
          </Pressable>
        </View>
      ) : isRunning ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.subtitle}>
            {activeStart ? `Start um ${activeStart.label}` : 'Freier Countdown'}
          </Text>
          <Text style={styles.countdown}>{formatCountdown(remainingSeconds)}</Text>
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonLabel}>Stoppen</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedText}>Start!</Text>
          <Pressable style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonLabel}>Neu starten</Text>
          </Pressable>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0d2b45',
  },
  clock: {
    fontSize: 22,
    fontWeight: '500',
    color: '#214d72',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#214d72',
    textAlign: 'center',
  },
  selectionContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdown: {
    fontSize: 72,
    fontWeight: '700',
    color: '#0d2b45',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  finishedContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  finishedText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#198754',
  },
  customTitle: {
    marginTop: 12,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#214d72',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#0d2b45',
    backgroundColor: '#ffffff',
    minWidth: 70,
    textAlign: 'center',
  },
  customSeparator: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0d2b45',
  },
  offsetButton: {
    backgroundColor: '#214d72',
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offsetButtonLabel: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  offsetLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#214d72',
    minWidth: 110,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
