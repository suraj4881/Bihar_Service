import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Chip,
  alpha,
  IconButton,
  useTheme,
  Autocomplete,
  CircularProgress,
  Stack,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import MyLocation from '@mui/icons-material/MyLocation';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import NorthEastRounded from '@mui/icons-material/NorthEastRounded';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import PaymentsRounded from '@mui/icons-material/PaymentsRounded';
import HeadsetMicRounded from '@mui/icons-material/HeadsetMicRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import ContentCut from '@mui/icons-material/ContentCut';
import AcUnit from '@mui/icons-material/AcUnit';
import Build from '@mui/icons-material/Build';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Carpenter from '@mui/icons-material/Carpenter';
import ElectricBolt from '@mui/icons-material/ElectricBolt';
import FormatPaint from '@mui/icons-material/FormatPaint';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  SERVICE_CATEGORIES,
  OFFERS,
  POPULAR_SERVICES,
  TRUST_POINTS,
  FILTER_TABS,
} from '../../data/homeContent';
import { BIHAR_CITIES } from '../../utils/constants';

const TEAL = '#004D40';
const TEAL_MID = '#00695C';
const ACCENT = '#26A69A';

const categoryIcon = (key: string) => {
  const sx = { fontSize: 28, color: '#fff' };
  switch (key) {
    case 'content_cut':
      return <ContentCut sx={sx} />;
    case 'ac_unit':
      return <AcUnit sx={sx} />;
    case 'build':
      return <Build sx={sx} />;
    case 'auto_awesome':
      return <AutoAwesome sx={sx} />;
    case 'carpenter':
      return <Carpenter sx={sx} />;
    case 'electric_bolt':
      return <ElectricBolt sx={sx} />;
    case 'format_paint':
      return <FormatPaint sx={sx} />;
    default:
      return <MoreHoriz sx={sx} />;
  }
};

const trustIcon = (icon: (typeof TRUST_POINTS)[0]['icon']) => {
  const sx = { fontSize: 32, color: ACCENT };
  switch (icon) {
    case 'verified':
      return <VerifiedUser sx={sx} />;
    case 'payments':
      return <PaymentsRounded sx={sx} />;
    case 'headset_mic':
      return <HeadsetMicRounded sx={sx} />;
    case 'shield':
      return <ShieldRounded sx={sx} />;
    default:
      return <VerifiedUser sx={sx} />;
  }
};

export interface SewaStats {
  totalProviders: number;
  verifiedProviders: number;
  totalCustomers: number;
  totalBookings: number;
  totalCategories: number;
  averageRating: number;
}

interface SewaMarketingHomeProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  locationLabel: string;
  setLocationLabel: (v: string) => void;
  onSearch: () => void;
  /** GPS / reverse-geocode — updates LocationContext + persisted search city */
  onUseGpsLocation: () => void;
  gpsLocationLoading: boolean;
  stats: SewaStats;
  statsLoading: boolean;
  formatNumber: (n: number) => string;
}

const SewaMarketingHome: React.FC<SewaMarketingHomeProps> = ({
  searchQuery,
  setSearchQuery,
  locationLabel,
  setLocationLabel,
  onSearch,
  onUseGpsLocation,
  gpsLocationLoading,
  stats,
  statsLoading,
  formatNumber,
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const theme = useTheme();
  const [filterTab, setFilterTab] = useState<(typeof FILTER_TABS)[number]>('All');

  const hi = language === 'hi';

  const filteredPopular = useMemo(() => {
    if (filterTab === 'All') return POPULAR_SERVICES;
    return POPULAR_SERVICES.filter((s) => s.category === filterTab);
  }, [filterTab]);

  const goSearch = (q: string) => {
    const query = q.trim() || searchQuery.trim();
    navigate(`/services?q=${encodeURIComponent(query)}&location=${encodeURIComponent(locationLabel)}`);
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.mode === 'dark' ? '#0D1514' : '#F0F4F3',
        minHeight: '100vh',
        pb: { xs: 12, md: 4 },
      }}
    >
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(165deg, ${TEAL} 0%, ${TEAL_MID} 45%, #00897B 100%)`,
          pt: { xs: 2, md: 3 },
          pb: { xs: 10, md: 12 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ maxWidth: { md: '72%' } }}>
            <Typography
              component="h1"
              sx={{
                color: '#fff',
                fontWeight: 800,
                fontSize: { xs: '1.65rem', sm: '2rem', md: '2.35rem' },
                lineHeight: 1.25,
                mb: 1,
              }}
            >
              {hi ? (
                <>
                  भरोसेमंद होम सर्विस।{' '}
                  <Box component="span" sx={{ color: alpha('#fff', 0.9), fontWeight: 700 }}>
                    मिनटों में बुक करें।
                  </Box>
                </>
              ) : (
                <>
                  Trusted home services.{' '}
                  <Box component="span" sx={{ color: alpha('#fff', 0.92), fontWeight: 700 }}>
                    Book in minutes.
                  </Box>
                </>
              )}
            </Typography>
            <Typography
              sx={{
                color: alpha('#fff', 0.75),
                fontSize: { xs: '0.88rem', sm: '0.95rem' },
                mb: 2.5,
              }}
            >
              {hi
                ? 'सत्यापित प्रो • फिक्स्ड प्राइस • 60 मिनट में रिस्पॉन्स'
                : 'Verified pros • Fixed pricing • 60-min response'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                component="label"
                htmlFor="hero-service-city"
                sx={{
                  display: 'block',
                  color: alpha('#fff', 0.88),
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  mb: 0.75,
                }}
              >
                {hi ? 'सेवा शहर' : 'Service city'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                <Autocomplete
                  id="hero-service-city"
                  fullWidth
                  size="small"
                  options={BIHAR_CITIES}
                  value={locationLabel}
                  onChange={(_, v) => {
                    if (v) setLocationLabel(v);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={hi ? 'शहर चुनें' : 'Select city'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#fff',
                          borderRadius: 2,
                          minHeight: 40,
                        },
                      }}
                    />
                  )}
                />
                <IconButton
                  type="button"
                  onClick={onUseGpsLocation}
                  disabled={gpsLocationLoading}
                  sx={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    bgcolor: alpha('#fff', 0.18),
                    color: '#fff',
                    borderRadius: 2,
                    '&:hover': { bgcolor: alpha('#fff', 0.28) },
                    '&.Mui-disabled': { color: alpha('#fff', 0.6) },
                  }}
                  aria-label={hi ? 'मेरा स्थान' : 'Use my location'}
                  title={hi ? 'मेरा स्थान (GPS)' : 'Use my location (GPS)'}
                >
                  {gpsLocationLoading ? (
                    <CircularProgress size={22} sx={{ color: 'inherit' }} />
                  ) : (
                    <MyLocation />
                  )}
                </IconButton>
              </Stack>
            </Box>

            <TextField
              fullWidth
              placeholder={
                hi
                  ? 'प्लंबर, इलेक्ट्रीशियन, सैलून… खोजें'
                  : 'Plumber, electrician, salon dhundein…'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  borderRadius: 999,
                  pl: 1,
                  '& fieldset': { border: 'none' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: TEAL_MID, ml: 0.5 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={onSearch}
                      sx={{
                        mr: 0.5,
                        borderRadius: 999,
                        px: 2,
                        minWidth: 0,
                        bgcolor: '#212121',
                        '&:hover': { bgcolor: '#000' },
                      }}
                    >
                      {hi ? 'खोजें' : 'Search'}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                {
                  icon: <CheckCircleRounded sx={{ fontSize: 18 }} />,
                  label: hi ? 'सत्यापित प्रो' : 'Verified pros',
                },
                {
                  icon: <StarRounded sx={{ fontSize: 18 }} />,
                  label: statsLoading
                    ? hi
                      ? '4.8★+ रेटेड'
                      : '4.8★+ rated'
                    : `${(stats.averageRating || 4.8).toFixed(1)}★ rated`,
                },
                {
                  icon: <AccessTimeRounded sx={{ fontSize: 18 }} />,
                  label: hi ? 'उसी दिन' : 'Same-day',
                },
              ].map((pill) => (
                <Chip
                  key={pill.label}
                  icon={pill.icon}
                  label={pill.label}
                  sx={{
                    bgcolor: alpha('#000', 0.2),
                    color: '#fff',
                    border: `1px solid ${alpha('#fff', 0.15)}`,
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: '#fff' },
                  }}
                />
              ))}
            </Box>

            {!statsLoading && (
              <Typography sx={{ color: alpha('#fff', 0.65), fontSize: '0.8rem', mt: 2 }}>
                {hi ? (
                  <>
                    {formatNumber(stats.verifiedProviders)}+ सत्यापित प्रो • {formatNumber(stats.totalBookings)}+
                    बुकिंग्स
                  </>
                ) : (
                  <>
                    {formatNumber(stats.verifiedProviders)}+ verified pros • {formatNumber(stats.totalBookings)}+
                    bookings on the platform
                  </>
                )}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>

      {/* Overlapping categories card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          mt: { xs: -5, md: -7 },
          mb: { xs: 2, md: 3 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 3 } }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 4, md: 5 },
              boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(4, 1fr)',
                    sm: 'repeat(4, 1fr)',
                    md: 'repeat(8, 1fr)',
                  },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <Box
                    key={c.id}
                    onClick={() => (c.searchTerm ? goSearch(c.searchTerm) : navigate('/services'))}
                    sx={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-3px)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 52, sm: 64 },
                        height: { xs: 52, sm: 64 },
                        borderRadius: '50%',
                        bgcolor: c.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 0.75,
                        boxShadow: `0 8px 20px ${alpha(c.color, 0.45)}`,
                      }}
                    >
                      {categoryIcon(c.iconKey)}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        display: 'block',
                        lineHeight: 1.2,
                      }}
                    >
                      {hi ? c.nameHi : c.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, mt: 4 }}>
        {/* Offers */}
        <Box id="sewa-offers" sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              {hi ? 'आज के ऑफर' : 'Aaj ke offers'} 🔥
            </Typography>
            <Button
              size="small"
              onClick={() => {
                const el = document.getElementById('sewa-offers');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{ color: TEAL_MID, fontWeight: 700, textTransform: 'none' }}
            >
              {hi ? 'सभी ऑफर' : 'All offers'}
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
              mx: { xs: -2, sm: 0 },
              px: { xs: 2, sm: 0 },
              scrollSnapType: 'x mandatory',
              '&::-webkit-scrollbar': { height: 6 },
            }}
          >
            {OFFERS.map((o) => (
              <Card
                key={o.id}
                sx={{
                  minWidth: { xs: '85%', sm: 360 },
                  maxWidth: 400,
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  borderRadius: 3,
                  background: o.gradient,
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', p: 2, alignItems: 'stretch', minHeight: 140 }}>
                  <Box sx={{ flex: 1, pr: 1, zIndex: 1 }}>
                    <Chip
                      label={o.badge}
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: alpha('#FFEB3B', 0.95),
                        color: '#333',
                        fontWeight: 800,
                        fontSize: '0.65rem',
                      }}
                    />
                    <Typography fontWeight={800} fontSize="1.1rem" lineHeight={1.3}>
                      {o.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, mb: 1.5 }}>
                      {o.subtitle}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      endIcon={<NorthEastRounded sx={{ fontSize: 16 }} />}
                      onClick={() => goSearch(o.subtitle)}
                      sx={{
                        bgcolor: '#fff',
                        color: TEAL,
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { bgcolor: alpha('#fff', 0.9) },
                      }}
                    >
                      {o.cta}
                    </Button>
                  </Box>
                  <Box
                    component="img"
                    src={o.imageUrl}
                    alt=""
                    sx={{
                      width: 120,
                      objectFit: 'cover',
                      borderRadius: 2,
                      alignSelf: 'stretch',
                    }}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Plus */}
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(90deg, #E0F2F1 0%, #B2DFDB 100%)',
            border: `1px solid ${alpha(TEAL_MID, 0.15)}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              p: { xs: 2, sm: 2.5 },
              gap: 2,
            }}
          >
            <Box>
              <Typography fontWeight={900} letterSpacing={1} color={TEAL} fontSize="0.85rem">
                SEWABIHAR PLUS
              </Typography>
              <Typography fontWeight={700} color="#263238" fontSize={{ xs: '1.05rem', sm: '1.15rem' }}>
                {hi ? 'सालाना ₹2,000 तक बचत' : 'Save up to ₹2,000/year'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {hi
                  ? '15% छूट • प्रायोरिटी प्रो • मुफ्त री-विजिट'
                  : '15% off • Priority pros • Free re-visits'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                alignSelf: { xs: 'stretch', sm: 'center' },
                bgcolor: '#212121',
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                whiteSpace: 'nowrap',
              }}
            >
              {hi ? 'Plus जॉइन करें →' : 'Join Plus →'}
            </Button>
          </Box>
        </Card>

        {/* Popular in city */}
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          {hi ? 'पटना में लोकप्रिय' : 'Popular in Patna'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            mb: 3,
          }}
        >
          {FILTER_TABS.map((tab) => (
            <Chip
              key={tab}
              label={tab}
              onClick={() => setFilterTab(tab)}
              sx={{
                fontWeight: 700,
                bgcolor: filterTab === tab ? TEAL : '#fff',
                color: filterTab === tab ? '#fff' : 'text.primary',
                border: filterTab === tab ? 'none' : `1px solid ${alpha('#000', 0.08)}`,
                '&:hover': {
                  bgcolor: filterTab === tab ? TEAL_MID : alpha(TEAL, 0.08),
                },
              }}
            />
          ))}
        </Box>

        <Grid container spacing={2}>
          {filteredPopular.map((svc) => (
            <Grid item xs={12} sm={6} lg={3} key={svc.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <Box sx={{ position: 'relative', aspectRatio: '4/3' }}>
                  <Box
                    component="img"
                    src={svc.imageUrl}
                    alt=""
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {svc.offer && (
                    <Chip
                      label={svc.offer}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        fontWeight: 800,
                        bgcolor: '#FF5252',
                        color: '#fff',
                      }}
                    />
                  )}
                  <Chip
                    label={`${svc.rating} ★`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      fontWeight: 800,
                      bgcolor: alpha('#000', 0.55),
                      color: '#fff',
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Typography fontWeight={800} fontSize="1rem" gutterBottom>
                    {svc.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {svc.bookings} {hi ? 'बुकिंग' : 'bookings'} · {svc.category}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography fontWeight={800} color={TEAL}>
                      {hi ? 'शुरू' : 'Starts'} ₹{svc.price}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => goSearch(svc.title)}
                      sx={{
                        bgcolor: ACCENT,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        '&:hover': { bgcolor: TEAL_MID },
                      }}
                    >
                      {hi ? 'बुक' : 'Book'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredPopular.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {hi ? 'इस फ़िल्टर के लिए कोई आइटम नहीं।' : 'No items for this filter.'}
          </Typography>
        )}

        {/* Trust */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2, textAlign: 'center' }}>
            {hi ? 'बिहार भरोसा करता है' : 'Bihar bharosa karta hai'}
          </Typography>
          <Grid container spacing={2}>
            {TRUST_POINTS.map((t) => (
              <Grid item xs={12} sm={6} md={3} key={t.title}>
                <Card sx={{ p: 2, height: '100%', borderRadius: 3, bgcolor: '#fff' }}>
                  <Box sx={{ mb: 1 }}>{trustIcon(t.icon)}</Box>
                  <Typography fontWeight={800} gutterBottom>
                    {hi ? t.titleHi : t.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hi ? t.descHi : t.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ textAlign: 'center', pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/services')}
            sx={{
              borderColor: TEAL_MID,
              color: TEAL_MID,
              fontWeight: 700,
              textTransform: 'none',
              px: 4,
              borderRadius: 3,
            }}
          >
            {hi ? 'सभी सेवाएँ देखें' : 'Browse all services'}
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap',
            py: 3,
            borderTop: `1px solid ${alpha('#000', 0.06)}`,
          }}
        >
          {[
            { to: '/about', en: 'About', hi: 'हमारे बारे में' },
            { to: '/contact', en: 'Contact', hi: 'संपर्क' },
            { to: '/login', en: 'Login', hi: 'लॉगिन' },
          ].map((l) => (
            <Typography
              key={l.to}
              component={RouterLink}
              to={l.to}
              sx={{
                color: TEAL_MID,
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {hi ? l.hi : l.en}
            </Typography>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default SewaMarketingHome;
