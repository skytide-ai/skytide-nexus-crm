import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarIcon, Calendar, CheckCircle, Clock, Crown, DollarSign, TrendingUp, UserPlus, Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useDashboardStats, useHistoricalStats } from '@/hooks/useDashboardStats';
import { useDailyStats } from '@/hooks/useDailyStats';
import { useState } from 'react';

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [chartView, setChartView] = useState<"monthly" | "daily">("monthly");
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedDate);
  const { data: historicalData, isLoading: historicalLoading } = useHistoricalStats(6);
  const { data: dailyData, isLoading: dailyLoading } = useDailyStats(selectedDate);
  
  // Encontrar el servicio seleccionado
  const selectedService = selectedServiceId 
    ? stats?.service_stats.find(service => service.service_id === selectedServiceId)
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (statsLoading || historicalLoading || dailyLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header del Dashboard */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general de tu organización</p>
        </div>
        <Select 
          value={format(selectedDate, 'yyyy-MM')}
          onValueChange={(value) => {
            const [year, month] = value.split('-');
            setSelectedDate(new Date(parseInt(year), parseInt(month) - 1));
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={format(selectedDate, 'MMMM yyyy', { locale: es })} />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              return (
                <SelectItem
                  key={format(date, 'yyyy-MM')}
                  value={format(date, 'yyyy-MM')}
                >
                  {format(date, 'MMMM yyyy', { locale: es })}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Nuevos Clientes</CardTitle>
            <div className="p-2 bg-blue-500 rounded-full">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats?.new_contacts || 0}</div>
            <div className="flex items-center mt-2">
              <p className="text-sm text-blue-700">
                Este mes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Citas Totales</CardTitle>
            <div className="p-2 bg-purple-500 rounded-full">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats?.total_appointments || 0}</div>
            <div className="flex items-center mt-2 gap-1">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <p className="text-sm text-purple-700">
                {stats?.total_completed_appointments || 0} completadas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Facturación Total</CardTitle>
            <div className="p-2 bg-green-500 rounded-full">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{formatCurrency(stats?.total_revenue || 0)}</div>
            <div className="flex items-center mt-2 gap-1">
              <Calendar className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">
                Del mes actual
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Servicios Activos</CardTitle>
            <div className="p-2 bg-amber-500 rounded-full">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats?.service_stats.length || 0}</div>
            <div className="flex items-center mt-2 gap-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-700">
                Con citas este mes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Mensual */}
      <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Resumen Mensual</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {chartView === "monthly" 
                ? "Tendencias de los últimos 6 meses" 
                : `Datos diarios de ${format(selectedDate, 'MMMM yyyy', { locale: es })}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={chartView === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("monthly")}
              className="text-xs h-8"
            >
              Últimos 6 meses
            </Button>
            <Button
              variant={chartView === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartView("daily")}
              className="text-xs h-8"
            >
              Mes actual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart 
              data={chartView === "monthly" ? historicalData : dailyData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="citasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="facturacionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
              />
              <XAxis 
                dataKey={chartView === "monthly" ? "name" : "date"} 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}K`;
                  }
                  return `$${value}`;
                }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Facturación') return formatCurrency(value);
                  return `${value} ${name.toLowerCase()}`;
                }}
                labelFormatter={(label) => {
                  if (chartView === "monthly") {
                    return `${label} ${new Date().getFullYear()}`;
                  } else {
                    return label;
                  }
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-sm font-medium">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="citas"
                stroke="#818cf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#citasGradient)"
                yAxisId="left"
                name="Citas"
                connectNulls
                dot={{ stroke: '#818cf8', strokeWidth: 2, r: 4, fill: 'white' }}
                activeDot={{
                  stroke: '#818cf8',
                  strokeWidth: 2,
                  r: 6,
                  fill: 'white',
                  strokeOpacity: 1
                }}
              />
              <Area
                type="monotone"
                dataKey="facturacion"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#facturacionGradient)"
                yAxisId="right"
                name="Facturación"
                connectNulls
                dot={{ stroke: '#34d399', strokeWidth: 2, r: 4, fill: 'white' }}
                activeDot={{
                  stroke: '#34d399',
                  strokeWidth: 2,
                  r: 6,
                  fill: 'white',
                  strokeOpacity: 1
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Servicios y Análisis por Servicio */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Top 5 Servicios
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {stats?.service_stats
                .slice(0, 5)
                .map((service, index) => (
                  <div key={service.service_id} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-none w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-white font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
                          {service.service_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                            <Calendar className="h-3 w-3" />
                            {service.service_appointments} citas totales
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3" />
                            {service.service_completed_appointments} confirmadas
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(service.service_revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-4 top-12 bottom-0 w-px bg-violet-100"></div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              Análisis por Servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Select 
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                >
                  <SelectTrigger className="flex-1 border-2 border-violet-100 hover:border-violet-200 transition-colors">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {stats?.service_stats.map((service) => (
                      <SelectItem 
                        key={service.service_id} 
                        value={service.service_id}
                        className="cursor-pointer hover:bg-violet-50"
                      >
                        {service.service_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  className="border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
                  onClick={() => setSelectedServiceId("")}
                  disabled={!selectedServiceId}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>

              {selectedService && (
                <div className="grid grid-cols-1 gap-6 mt-6">
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-6 rounded-xl border border-violet-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-violet-900">Total de Citas</h3>
                      <Calendar className="h-5 w-5 text-violet-500" />
                    </div>
                    <p className="text-3xl font-bold text-violet-900">
                      {selectedService.service_appointments}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="h-4 w-4 text-violet-600" />
                      <p className="text-sm text-violet-700">
                        {selectedService.service_completed_appointments} citas completadas
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-green-900">Facturación</h3>
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                      {formatCurrency(selectedService.service_revenue)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-700">
                        Ingresos totales del servicio
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
