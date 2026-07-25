import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import Translate, { translate } from '@docusaurus/Translate';
import MuiTheme from '@site/src/components/MuiTheme';
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { fakerJA, faker } from '@faker-js/faker'; // Default to Japanese locale
import styles from './styles.module.css';

/**
 * ダミーデータのフィールド定義
 */
type FieldType =
  | 'id'
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'jobTitle'
  | 'companyName'
  | 'address'
  | 'country'
  | 'productName'
  | 'price'
  | 'date'
  | 'boolean'
  | 'word';

interface FieldDef {
  id: string; // React Key
  name: string; // Column name
  type: FieldType;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'id', label: 'ID (UUID)' },
  { value: 'fullName', label: '氏名 (Full Name)' },
  { value: 'firstName', label: '名 (First Name)' },
  { value: 'lastName', label: '姓 (Last Name)' },
  { value: 'email', label: 'メールアドレス (Email)' },
  { value: 'phone', label: '電話番号 (Phone)' },
  { value: 'jobTitle', label: '役職 (Job Title)' },
  { value: 'companyName', label: '会社名 (Company)' },
  { value: 'address', label: '住所 (Address)' },
  { value: 'country', label: '国 (Country)' },
  { value: 'productName', label: '商品名 (Product)' },
  { value: 'price', label: '価格 (Price)' },
  { value: 'date', label: '日付 (Date - Past)' },
  { value: 'boolean', label: '真偽値 (Boolean)' },
  { value: 'word', label: '単語 (Word)' },
];

const PRESETS: Record<string, FieldDef[]> = {
  user: [
    { id: '1', name: 'id', type: 'id' },
    { id: '2', name: 'name', type: 'fullName' },
    { id: '3', name: 'email', type: 'email' },
    { id: '4', name: 'phone', type: 'phone' },
    { id: '5', name: 'address', type: 'address' },
  ],
  company: [
    { id: '1', name: 'id', type: 'id' },
    { id: '2', name: 'company_name', type: 'companyName' },
    { id: '3', name: 'country', type: 'country' },
    { id: '4', name: 'founded_date', type: 'date' },
  ],
  product: [
    { id: '1', name: 'id', type: 'id' },
    { id: '2', name: 'product_name', type: 'productName' },
    { id: '3', name: 'price', type: 'price' },
    { id: '4', name: 'is_available', type: 'boolean' },
  ],
};

const generateValue = (type: FieldType, useFakerEn: boolean): string | number | boolean => {
  const f = useFakerEn ? faker : fakerJA;
  switch (type) {
    case 'id': return f.string.uuid();
    case 'fullName': return f.person.fullName();
    case 'firstName': return f.person.firstName();
    case 'lastName': return f.person.lastName();
    case 'email': return f.internet.email();
    case 'phone': return f.phone.number();
    case 'jobTitle': return f.person.jobTitle();
    case 'companyName': return f.company.name();
    case 'address': return f.location.streetAddress();
    case 'country': return f.location.country();
    case 'productName': return f.commerce.productName();
    case 'price': return parseFloat(f.commerce.price());
    case 'date': return f.date.past().toISOString().split('T')[0];
    case 'boolean': return f.datatype.boolean();
    case 'word': return f.word.sample();
    default: return f.word.sample();
  }
};

/**
 * ダミーデータジェネレーターコンポーネント
 */
export default function DummyDataGenerator(): JSX.Element {
  const history = useHistory();
  const location = useLocation();

  // URL Query Parameters
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const qPreset = query.get('preset') || 'user';
  const qCount = parseInt(query.get('count') || '10', 10);
  const qFormat = query.get('format') || 'json';
  const qTableName = query.get('tableName') || 'users';
  const qLocale = query.get('locale') || 'ja';
  
  // State
  const [preset, setPreset] = useState<string>(qPreset);
  const [count, setCount] = useState<number>(isNaN(qCount) ? 10 : Math.min(Math.max(qCount, 1), 1000));
  const [format, setFormat] = useState<string>(qFormat);
  const [tableName, setTableName] = useState<string>(qTableName);
  const [locale, setLocale] = useState<string>(qLocale);
  const [fields, setFields] = useState<FieldDef[]>(PRESETS[preset] || PRESETS.user);
  const [generatedData, setGeneratedData] = useState<string>('');

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('preset', preset);
    params.set('count', count.toString());
    params.set('format', format);
    params.set('tableName', tableName);
    params.set('locale', locale);
    // Note: To keep URLs short, we don't sync the full custom schema in MVP unless it's critical.
    history.replace({ search: `?${params.toString()}` });
  }, [preset, count, format, tableName, locale, history]);

  // Handle Preset Change
  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    if (PRESETS[newPreset]) {
      setFields([...PRESETS[newPreset].map(f => ({ ...f, id: crypto.randomUUID() }))]);
    }
  };

  // Field Management
  const addField = () => {
    setPreset('custom');
    setFields([...fields, { id: crypto.randomUUID(), name: 'new_field', type: 'word' }]);
  };

  const updateField = (id: string, key: keyof FieldDef, value: string) => {
    setPreset('custom');
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id: string) => {
    setPreset('custom');
    setFields(fields.filter(f => f.id !== id));
  };

  // Generate Data
  const generateData = useCallback(() => {
    const data: Record<string, any>[] = [];
    const useFakerEn = locale === 'en';

    for (let i = 0; i < count; i++) {
      const row: Record<string, any> = {};
      fields.forEach(field => {
        row[field.name] = generateValue(field.type, useFakerEn);
      });
      data.push(row);
    }

    let result = '';
    if (format === 'json') {
      result = JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      const headers = fields.map(f => f.name).join(',');
      const rows = data.map(row => 
        fields.map(f => {
          const val = row[f.name];
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val;
        }).join(',')
      );
      result = [headers, ...rows].join('\n');
    } else if (format === 'sql') {
      const cols = fields.map(f => f.name).join(', ');
      result = data.map(row => {
        const vals = fields.map(f => {
          const val = row[f.name];
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          return val;
        }).join(', ');
        return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
      }).join('\n');
    }

    setGeneratedData(result);
  }, [count, fields, format, tableName, locale]);

  // Initial Generation
  useEffect(() => {
    generateData();
  }, [generateData]);

  // Copy & Download Actions
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedData);
      // We can use a snackbar here, but alert is simpler for now, or just trust it works
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'sql';
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    link.download = `dummy-data-${timestamp}.${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <MuiTheme>
      <div className={styles.container}>
        <div className={styles.mainGrid}>
          {/* 左側：設定パネル */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              <Translate id="tool.dummyData.settings">設定 (Settings)</Translate>
            </div>

            <Box display="flex" gap={2}>
              <FormControl fullWidth size="small">
                <InputLabel><Translate id="tool.dummyData.preset">プリセット</Translate></InputLabel>
                <Select
                  value={preset}
                  label={translate({ id: 'tool.dummyData.preset', message: 'プリセット' })}
                  onChange={(e) => handlePresetChange(e.target.value)}
                >
                  <MenuItem value="user"><Translate id="tool.dummyData.preset.user">ユーザー情報</Translate></MenuItem>
                  <MenuItem value="company"><Translate id="tool.dummyData.preset.company">会社情報</Translate></MenuItem>
                  <MenuItem value="product"><Translate id="tool.dummyData.preset.product">商品情報</Translate></MenuItem>
                  <MenuItem value="custom"><Translate id="tool.dummyData.preset.custom">カスタム</Translate></MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel><Translate id="tool.dummyData.locale">データ言語</Translate></InputLabel>
                <Select
                  value={locale}
                  label={translate({ id: 'tool.dummyData.locale', message: 'データ言語' })}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  <MenuItem value="ja">日本語 (Japanese)</MenuItem>
                  <MenuItem value="en">英語 (English)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                <Translate id="tool.dummyData.fields">フィールド定義</Translate>
              </Typography>
              {fields.map((field, index) => (
                <div key={field.id} className={styles.fieldRow}>
                  <Tooltip title={translate({ id: 'tool.dummyData.dragToReorder', message: 'ドラッグして並び替え（未実装）' })}>
                    <div className={styles.fieldDragHandle}>
                      <DragIndicatorIcon fontSize="small" />
                    </div>
                  </Tooltip>
                  <TextField
                    size="small"
                    value={field.name}
                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                    placeholder="Field Name"
                    sx={{ flexGrow: 1 }}
                  />
                  <Select
                    size="small"
                    value={field.type}
                    onChange={(e) => updateField(field.id, 'type', e.target.value as FieldType)}
                    sx={{ width: 160 }}
                  >
                    {FIELD_TYPES.map(ft => (
                      <MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>
                    ))}
                  </Select>
                  <IconButton size="small" color="error" onClick={() => removeField(field.id)}>
                    <DeleteIcon />
                  </IconButton>
                </div>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addField}
                size="small"
                sx={{ mt: 1 }}
              >
                <Translate id="tool.dummyData.addField">フィールドを追加</Translate>
              </Button>
            </Box>

            <Box display="flex" gap={2} mt={2}>
              <TextField
                type="number"
                label={translate({ id: 'tool.dummyData.count', message: '生成件数' })}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                size="small"
                inputProps={{ min: 1, max: 1000 }}
                sx={{ width: 120 }}
              />
              <FormControl size="small" sx={{ flexGrow: 1 }}>
                <InputLabel><Translate id="tool.dummyData.format">出力形式</Translate></InputLabel>
                <Select
                  value={format}
                  label={translate({ id: 'tool.dummyData.format', message: '出力形式' })}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="sql">SQL (INSERT)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {format === 'sql' && (
              <TextField
                label={translate({ id: 'tool.dummyData.tableName', message: 'テーブル名' })}
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                size="small"
                fullWidth
                sx={{ mt: 1 }}
              />
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={generateData}
              sx={{ mt: 2 }}
              fullWidth
            >
              <Translate id="tool.dummyData.generateButton">データ生成</Translate>
            </Button>
          </div>

          {/* 右側：プレビューパネル */}
          <div className={styles.panel}>
            <div className={styles.panelTitle}>
              <Translate id="tool.dummyData.result">出力プレビュー (Preview)</Translate>
            </div>
            
            <div className={styles.resultContainer}>
              <textarea
                className={styles.resultTextArea}
                value={generatedData}
                readOnly
              />
            </div>

            <div className={styles.actions}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
              >
                <Translate id="tool.common.copy">コピー</Translate>
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                <Translate id="tool.common.download">ダウンロード</Translate>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MuiTheme>
  );
}
