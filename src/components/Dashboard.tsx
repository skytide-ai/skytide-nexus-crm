
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

const monthlyData = [
  { name: "Ene", citas: 65, facturacion: 2400000 },
  { name: "Feb", citas: 59, facturacion: 2100000 },
  { name: "Mar", citas: 80, facturacion: 2900000 },
  { name: "Abr", citas: 81, facturacion: 3200000 },
  { name: "May", citas: 56, facturacion: 2800000 },
  { name: "Jun", citas: 95, facturacion: 3500000 },
];

const topServices = [
  { name: "Consulta General", citas: 45, facturacion: 1350000 },
  { name: "Examen de Rutina", citas: 32, facturacion: 960000 },
  { name: "Especialidad", citas: 28, facturacion: 1400000 },
  { name: "Urgencias", citas: 15, facturacion: 750000 },
  { name: "Terapia", citas: 12, facturacion: 600000 },
];

// La variable pieColors ha sido eliminada ya que no se utiliza

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header del Dashboard */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general de tu organización</p>
        </div>
        <div className="flex gap-3">
          <Select defaultValue="mes">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="año">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-primary-700">
            Exportar reporte
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nuevos Clientes
            </CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="flex items-center text-sm text-success-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Agendamientos
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">147</div>
            <div className="flex items-center text-sm text-success-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8.3% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Facturación Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$4,250,000</div>
            <div className="flex items-center text-sm text-red-600 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -2.1% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Promedio por Día
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="flex items-center text-sm text-success-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +5.2% vs mes anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Citas por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Bar dataKey="citas" fill="#394bd1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Facturación Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Line 
                  type="monotone" 
                  dataKey="facturacion" 
                  stroke="#394bd1" 
                  strokeWidth={2}
                  dot={{ fill: '#394bd1', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top servicios y Análisis por Servicio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Servicios Más Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.map((service, index) => (
                <div key={service.name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.citas} citas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${service.facturacion.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">COP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análisis por Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Seleccionar Servicio
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige un servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {topServices.map((service) => (
                      <SelectItem key={service.name} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-primary hover:bg-primary-700">
                Analizar
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total de Citas</p>
                <p className="text-xl font-bold text-blue-900">45</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Facturación</p>
                <p className="text-xl font-bold text-green-900">$1.35M</p>
              </div>
            </div>
            
            {/* Gráfico comparativo */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Comparativa Mensual</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={[
                    { mes: 'Ene', citas: 8, facturacion: 240000 },
                    { mes: 'Feb', citas: 6, facturacion: 180000 },
                    { mes: 'Mar', citas: 10, facturacion: 300000 },
                    { mes: 'Abr', citas: 12, facturacion: 360000 },
                    { mes: 'May', citas: 9, facturacion: 270000 },
                  ]}
                  margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" hide />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" hide />
                  <Bar yAxisId="left" dataKey="citas" fill="#8884d8" radius={[4, 4, 0, 0]} name="Citas" />
                  <Bar yAxisId="right" dataKey="facturacion" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Facturación" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#8884d8]"></div>
                  <span className="text-xs text-gray-600">Citas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#82ca9d]"></div>
                  <span className="text-xs text-gray-600">Facturación</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* El componente de Análisis por Servicio se ha movido al lado del Top 5 */}
    </div>
  );
}
