import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ResponsiveTable from './ResponsiveTable';
import { Search, Settings, ChevronLeft, ChevronRight, LogOut, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../../context/themeContext';
import granautoLogo from '../../../assets/granauto.png';
import granautoLogoB from '../../../assets/granautob.png';
import invSeminuevosCSV from '../../../assets/data/inv_seminuevos.csv';
import DashboardFilters, { FilterValues } from './DashboardFilters';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [tableData, setTableData] = useState<any[]>([]); 
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;
  const [currentRecords, setCurrentRecords] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  
  // Estado para la fila seleccionada
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Define the type for a row of your CSV data
  interface InventoryRow {
    NumeroInventario?: string;
    Anio?: string;
    DiasEnInv?: string;
    Caracteristicas?: string;
    PrecioVta?: string;
    Origen?: string;
    Ubicacion?: string;
    Numero?: string;
    Color?: string;
    Obs_Veh?: string;
    [key: string]: any; // Permitir otras propiedades
  }

  // Cargar y procesar el CSV al montar el componente
  useEffect(() => {
    try {
      console.log('Intentando cargar CSV desde:', invSeminuevosCSV);
      Papa.parse(invSeminuevosCSV, {
        download: true,
        header: true,
        complete: (result) => {
          console.log('CSV Data:', result.data);
  
          // Mapeo del campo ubicación
          const ubicacionMap: Record<string, string> = {
            'AGUA PRIETA': 'Agua Prieta',
            'CABORCA': 'Caborca',
            'CANANEA': 'Cananea',
            'NOGALES': 'Nogales',
            'MAGDALENA': 'Magdalena',
            'GUAYMAS': 'Guaymas',
            'GUAYMAS SEMINUEVOS': 'Guaymas',
            'NAVOJOA': 'Navojoa',
            'PUERTO  PEÑASCO': 'Puerto Peñasco',
            'MORELIA': 'Morelos',
            'SALA MORELOS': 'Morelos',
            'SALA NISSAUTO': 'Nissauto',
            'NISSAUTO': 'Nissauto',
            'MACRO PLAZA': 'Macroplaza',
            'MACROPLAZA': 'Macroplaza',
            'GRANAUTO': 'Granauto',
            'ALMACEN MAGDALENA': 'Magdalena',
            'AUTO CLINICA MACRO': 'Auto Clínica Macroplaza',
            'ENTREGADO': 'Entregado',
            'MITSU CHIHUA-SEMI': 'Mitsu Chihuahua',
            'QUIROGA': 'Quiroga',
          };

          // Mapeo del campo origen
          const origenMap: Record<string, string> = {
            'AGUA PRIETA NISSAUTO': 'Agua Prieta',
            'CABORCA NISSAUTO': 'Caborca',
            'CANANEA': 'Cananea',
            'CANANEA NISSAUTO': 'Cananea',
            'MAGDALENA NISSAUTO': 'Magdalena',
            'NAVOJOA NISSAUTO': 'Navojoa',
            'NOGALES NISSAUTO': 'Nogales',
            'PEÑASCO NISSAUTO': 'Puerto Peñasco',
            'GUAYMAS': 'Guaymas',
            'MORELOS': 'Morelos',
            'MACROPLAZA': 'Macroplaza',
            'GRANAUTO': 'Granauto',
            'NISSAUTO': 'Nissauto',
            'QUIROGA': 'Quiroga',
          };
  
          // Transformación de los datos
          const transformedData = (result.data as InventoryRow[]).map((row: InventoryRow) => {
            return {
              ...row,
              Ubicacion: ubicacionMap[row['Ubicacion'] ?? ''] || 'OTRO', 
              Origen: origenMap[row['Origen'] ?? ''] || 'OTRO', 
              // Ensure DiasEnInv is "0" when it's 0 (not an empty string)
              DiasEnInv: String(row['DiasEnInv']) === '' ? '0' : row['DiasEnInv']
            };
          });
  
          // Ordenar los datos por "DiasEnInv" en orden ascendente
          const sortedData = transformedData.sort((a, b) => {
            const diasA = parseInt(a.DiasEnInv ?? '', 10) || 0;
            const diasB = parseInt(b.DiasEnInv ?? '', 10) || 0;
            return diasA - diasB;
          });
  
          // Filtrar los datos para mostrar solo registros con precio > 1
          const filteredByPrice = sortedData.filter(row => {
            const precioStr = row.PrecioVta ?? '0';
            const precio = parseFloat(precioStr.replace(/[^0-9.-]+/g, ''));
            return precio > 1;
          });
  
          setTableData(filteredByPrice);
          setFilteredData(filteredByPrice);
          setTotalPages(Math.ceil(filteredByPrice.length / recordsPerPage));
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setError('Error al cargar los datos del CSV');
          setLoading(false);
        },
      });
    } catch (e) {
      console.error('Error en el efecto de carga:', e);
      setError('Error al inicializar la carga de datos');
      setLoading(false);
    }
  }, []);

  // Manejo de cambios en los filtros
  // Manejo de cambios en los filtros
  const handleFilterChange = (filters: FilterValues) => {
    // Resetear a la primera página cuando se aplican filtros
    setCurrentPage(1);
    // Limpiar la selección cuando se cambian los filtros
    setSelectedRow(null);
    
    // Filtrar datos según los criterios
    const filtered = tableData.filter(row => {
      // Búsqueda por texto en múltiples campos
      const searchMatch = !filters.searchText || 
        Object.values(row).some(value => 
          value && String(value).toLowerCase().includes(filters.searchText.toLowerCase())
        );
      
      // Filtro por ubicación
      const ubicacionMatch = !filters.ubicacion || row.Ubicacion === filters.ubicacion;
      
      // Filtro por origen
      const origenMatch = !filters.origen || row.Origen === filters.origen;
      
      // Filtro por año - Corregido para comparar strings adecuadamente
      const yearMatch = !filters.year || row.Anio === filters.year;
      
      // Filtro por rango de días en inventario
      const diasEnInv = parseInt(row.DiasEnInv ?? '0', 10);
      const minDiasMatch = !filters.minDiasEnInv || diasEnInv >= parseInt(filters.minDiasEnInv, 10);
      const maxDiasMatch = !filters.maxDiasEnInv || diasEnInv <= parseInt(filters.maxDiasEnInv, 10);
      
      // Filtro por rango de precios - Corregido para manejar strings de formato monetario
      const precioStr = row.PrecioVta ?? '0';
      const precio = parseFloat(precioStr.replace(/[^0-9.-]+/g, ''));
      
      const minPrecioMatch = !filters.minPrecio || precio >= parseFloat(filters.minPrecio);
      const maxPrecioMatch = !filters.maxPrecio || precio <= parseFloat(filters.maxPrecio);
      
      return searchMatch && ubicacionMatch && origenMatch && yearMatch && minDiasMatch && maxDiasMatch && minPrecioMatch && maxPrecioMatch;
    });
    
    setFilteredData(filtered);
    setTotalPages(Math.ceil(filtered.length / recordsPerPage));
  };

  // Actualizar registros actuales cuando cambia la página o los datos filtrados
  useEffect(() => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    
    if (filteredData.length > 0) {
      setCurrentRecords(filteredData.slice(indexOfFirstRecord, indexOfLastRecord));
    }
    
    // Reset selected row when changing page
    setSelectedRow(null);
  }, [filteredData, currentPage, recordsPerPage]);

  // Funciones para la paginación
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Manejador de click para seleccionar una fila
  const handleRowClick = (index: number) => {
    // Si la fila ya está seleccionada, deseleccionarla
    if (selectedRow === index) {
      setSelectedRow(null);
    } else {
      setSelectedRow(index);
    }
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 6;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar si estamos en los límites
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const formatCurrency = (value: string | number) => {
    const numericValue = typeof value === 'string'
      ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
      : value;
  
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(numericValue);
  };

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Definición de anchos fijos para cada columna
  const columnWidths = {
    index: '50px',          // #
    numeroInventario: '70px',             // No. Inv
    anio: '70px',           // Año
    diasInv: '100px',       // Días en inventario
    caracteristicas: '200px', // Auto versión
    precioVta: '120px',     // Precio de venta
    origen: '120px',        // Origen
    ubicacion: '120px',     // Ubicación
    numero: '150px',        // Vin
    color: '100px',         // Color
    obsVeh: '200px',        // Observaciones vehículo
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* Contenedor principal */}
      <div className="mx-auto px-4 md:px-12 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <img
              src={darkMode ? granautoLogoB : granautoLogo}
              alt="Grupo Gran Auto"
              className="h-8 md:h-12"
              onError={(e) => {
                console.error('Error al cargar imagen');
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="gray"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">Logo</text></svg>';
              }}
            />
            <div className="ml-4">
              <h1 className="text-xl md:text-2xl font-bold">Business Intelligence</h1>
              <h2 className="text-base md:text-lg">Inventario Seminuevos</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Cambio de tema */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Cerrar sesión */}
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Componente de filtros */}
        {!loading && (
          <DashboardFilters
            onFilterChange={handleFilterChange}
            years={
              Array.from(
                new Set(
                  tableData
                    .map(row => row.Anio)
                    .filter((anio): anio is string => typeof anio === 'string' && anio.trim() !== '')
                )
              ).sort((a, b) => Number(b) - Number(a))
            }
          />
        )}

        {/* Área de contenido principal */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 flex justify-center items-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Cargando datos...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {currentRecords.length === 0 ? (
  <div className="p-8 text-center">
    <p>No hay datos disponibles que coincidan con los filtros seleccionados</p>
  </div>
) : (
  <ResponsiveTable 
    data={currentRecords}
    currentPage={currentPage}
    recordsPerPage={recordsPerPage}
    formatCurrency={formatCurrency}
    columnWidths={columnWidths}
    selectedRow={selectedRow}
    handleRowClick={handleRowClick}
  />
)}

            {/* Paginación */}
            {filteredData.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Página <span className="font-medium">{currentPage}</span> de{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                            currentPage === 1
                              ? 'text-gray-300 dark:text-gray-500'
                              : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        {getPageNumbers().map((number) => (
                          <button
                            key={number}
                            onClick={() => goToPage(number)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium ${
                              currentPage === number
                                ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-200'
                                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {number}
                          </button>
                        ))}
                        
                        <button
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                            currentPage === totalPages
                              ? 'text-gray-300 dark:text-gray-500'
                              : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="sr-only">Siguiente</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información sobre paginación */}
        {!loading && tableData.length > 0 && (() => {
          const indexOfLastRecord = currentPage * recordsPerPage;
          const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
          return (
            <div className="mt-2 mb-4 text-sm">
              <p className="text-sm text-gray-500">
                Mostrando registros {indexOfFirstRecord + 1}–{Math.min(indexOfLastRecord, filteredData.length)} de {filteredData.length}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Dashboard;