import React, { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Alert, Button, Form } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import '../styles/reportes.css';

const Reportes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    movimientosPorTipo: [],
    movimientosPorUsuario: [],
    rentabilidadProductos: [],
    inventario: []
  });
  const [filtroFecha, setFiltroFecha] = useState({
    fechaInicio: '',
    fechaFin: ''
  });
  
  // Estado para controlar qué informe mostrar
  const [activeReport, setActiveReport] = useState(null);
  
  const chartRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
    } catch (error) {
      console.error("Error verificando el token:", error);
      navigate('/');
    }
  }, [navigate]);

  // Modifica la función fetchReportData para incluir más depuración
  const fetchReportData = async (fechaInicio = null, fechaFin = null) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No hay un token de autenticación disponible");
        setLoading(false);
        return;
      }

      let url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reportes/movimientos`;
      
      // Añadir parámetros de fecha si se proporcionan
      if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
      }
      
      console.log("Realizando solicitud a:", url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Respuesta recibida:", response.data);

      // Procesar datos recibidos
      if (response.data) {
        setReportData(response.data);
        
        // Verificar si hay datos
        if (response.data.movimientosPorTipo.length === 0 && 
            response.data.movimientosPorUsuario.length === 0) {
          console.log("No se encontraron movimientos para mostrar");
        }
      } else {
        setError("No se recibieron datos del servidor");
      }
    } catch (err) {
      console.error("Error obteniendo datos de reportes:", err);
      setError(`Error al cargar los datos: ${err.message}. Verifica tu conexión o permisos.`);
      if (err.response) {
        console.error("Respuesta del servidor:", err.response.status, err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reemplaza la función fetchRentabilidadData
  const fetchRentabilidadData = async (fechaInicio = null, fechaFin = null) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No hay un token de autenticación disponible");
        setLoading(false);
        return;
      }

      let url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reportes/rentabilidad`;
      
      // Añadir parámetros de fecha si se proporcionan
      const params = [];
      if (fechaInicio) params.push(`fecha_inicio=${fechaInicio}`);
      if (fechaFin) params.push(`fecha_fin=${fechaFin}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      console.log("Realizando solicitud a:", url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Respuesta recibida:", response.data);

      // Procesar datos recibidos
      if (response.data && response.data.rentabilidadProductos) {
        // Ordenar por rentabilidad total
        const datosOrdenados = [...response.data.rentabilidadProductos].sort((a, b) => b.rentabilidad_total - a.rentabilidad_total);
        
        setReportData(prevData => ({
          ...prevData,
          rentabilidadProductos: datosOrdenados
        }));
        
        // Verificar si hay datos
        if (datosOrdenados.length === 0) {
          setError("No hay datos de rentabilidad en el período seleccionado.");
        }
      } else {
        setError("No se recibieron datos de rentabilidad del servidor");
      }
    } catch (err) {
      console.error("Error obteniendo datos de rentabilidad:", err);
      setError(`Error al cargar los datos de rentabilidad: ${err.message}. Verifica tu conexión o permisos.`);
      if (err.response) {
        console.error("Respuesta del servidor:", err.response.status, err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Añadir esta función después de fetchRentabilidadData
  const fetchInventarioData = async (fechaInicio = null, fechaFin = null) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No hay un token de autenticación disponible");
        setLoading(false);
        return;
      }

      let url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reportes/inventario`;
      
      // Añadir parámetros de fecha si se proporcionan
      const params = [];
      if (fechaInicio) params.push(`fecha_inicio=${fechaInicio}`);
      if (fechaFin) params.push(`fecha_fin=${fechaFin}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      console.log("Realizando solicitud a:", url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Respuesta recibida:", response.data);

      // Procesar datos recibidos
      if (response.data && response.data.inventario) {
        setReportData(prevData => ({
          ...prevData,
          inventario: response.data.inventario
        }));
        
        // Verificar si hay datos
        if (response.data.inventario.length === 0) {
          setError("No hay datos de inventario en el período seleccionado.");
        }
      } else {
        setError("No se recibieron datos de inventario del servidor");
      }
    } catch (err) {
      console.error("Error obteniendo datos de inventario:", err);
      setError(`Error al cargar los datos de inventario: ${err.message}. Verifica tu conexión o permisos.`);
      if (err.response) {
        console.error("Respuesta del servidor:", err.response.status, err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroSubmit = (e) => {
    e.preventDefault();
    if (filtroFecha.fechaInicio && filtroFecha.fechaFin) {
      fetchReportData(filtroFecha.fechaInicio, filtroFecha.fechaFin);
    } else {
      setError("Por favor selecciona fechas de inicio y fin");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltroFecha(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Configuración para gráfico de movimientos por tipo
  const tipoMovimientosConfig = {
    chart: {
      type: 'pie',
      backgroundColor: '#222831',
      style: {
        fontFamily: 'Arial, sans-serif',
        color: '#e3e3e3'
      }
    },
    title: {
      text: 'Movimientos por Tipo',
      style: { color: '#e3e3e3' }
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        colors: ['#4CAF50', '#F44336', '#FFC107'],
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
          style: {
            color: '#e3e3e3'
          }
        }
      }
    },
    credits: { enabled: false },
    series: [{
      name: 'Movimientos',
      colorByPoint: true,
      data: reportData.movimientosPorTipo.map(item => ({
        name: item.tipo,
        y: item.cantidad
      }))
    }]
  };

  // Configuración para gráfico de movimientos por usuario
  const usuarioMovimientosConfig = {
    chart: {
      type: 'column',
      backgroundColor: '#222831',
      style: {
        fontFamily: 'Arial, sans-serif',
        color: '#e3e3e3'
      }
    },
    title: {
      text: 'Movimientos por Usuario',
      style: { color: '#e3e3e3' }
    },
    xAxis: {
      categories: reportData.movimientosPorUsuario.map(item => item.nombre),
      labels: {
        style: { color: '#e3e3e3' }
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Cantidad de Movimientos',
        style: { color: '#e3e3e3' }
      },
      labels: {
        style: { color: '#e3e3e3' }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      pointFormat: 'Movimientos: <b>{point.y}</b>'
    },
    credits: { enabled: false },
    series: [{
      name: 'Movimientos',
      data: reportData.movimientosPorUsuario.map(item => item.cantidad),
      color: '#6764ff'
    }]
  };

  // Configuración para gráfico de rentabilidad por producto
  const rentabilidadProductosConfig = {
    chart: {
      type: 'bar',  // Cambiado a gráfico de barras horizontal
      backgroundColor: '#222831',
      style: {
        fontFamily: 'Arial, sans-serif',
        color: '#e3e3e3'
      },
      height: 500  // Altura fija para mejor visualización
    },
    title: {
      text: 'Productos más rentables',
      style: { color: '#e3e3e3', fontSize: '18px' }
    },
    xAxis: {
      categories: reportData.rentabilidadProductos 
        ? reportData.rentabilidadProductos.slice(0, 10).map(item => item.nombre)
        : [],
      labels: {
        style: { color: '#e3e3e3' }
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Rentabilidad Total (COP)',
        style: { color: '#e3e3e3' }
      },
      labels: {
        style: { color: '#e3e3e3' },
        formatter: function() {
          return '$' + this.value.toLocaleString('es-CO');
        }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      useHTML: true,
      formatter: function() {
        const producto = reportData.rentabilidadProductos.find(p => p.nombre === this.x);
        return `<div style="padding: 8px;">
                  <h4 style="margin: 0 0 8px 0; color: #fff;">${this.x}</h4>
                  <table>
                    <tr>
                      <td style="color: #999;">Rentabilidad:</td>
                      <td style="text-align: right; color: #4CAF50;"><b>$${this.y.toLocaleString('es-CO')}</b></td>
                    </tr>
                    <tr>
                      <td style="color: #999;">Unidades vendidas:</td>
                      <td style="text-align: right; color: #fff;"><b>${producto.cantidad_vendida}</b></td>
                    </tr>
                    <tr>
                      <td style="color: #999;">Margen unitario:</td>
                      <td style="text-align: right; color: #FFC107;"><b>$${producto.margen_unitario.toLocaleString('es-CO')}</b></td>
                    </tr>
                  </table>
                </div>`;
      }
    },
    credits: { enabled: false },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          formatter: function() {
            return '$' + this.y.toLocaleString('es-CO');
          },
          style: { color: '#e3e3e3', fontWeight: 'bold' }
        },
        colorByPoint: true,
        colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#F44336', '#E91E63', '#9C27B0']
      }
    },
    series: [{
      name: 'Rentabilidad',
      data: reportData.rentabilidadProductos 
        ? reportData.rentabilidadProductos.slice(0, 10).map(item => item.rentabilidad_total)
        : []
    }]
  };

  const margenPorcentajeConfig = {
    chart: {
      type: 'bar',
      backgroundColor: '#222831',
      style: {
        fontFamily: 'Arial, sans-serif',
        color: '#e3e3e3'
      }
    },
    title: {
      text: 'Margen de Ganancia (%)',
      style: { color: '#e3e3e3' }
    },
    xAxis: {
      categories: reportData.rentabilidadProductos 
        ? reportData.rentabilidadProductos.slice(0, 10).map(item => item.nombre)
        : [],
      labels: {
        style: { color: '#e3e3e3' },
        rotation: -45,
        align: 'right'
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Margen (%)',
        style: { color: '#e3e3e3' }
      },
      labels: {
        style: { color: '#e3e3e3' },
        formatter: function() {
          return this.value + '%';
        }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      formatter: function() {
        const producto = reportData.rentabilidadProductos.find(p => p.nombre === this.x);
        return `<b>${this.x}</b><br/>
                Margen: ${this.y.toFixed(2)}%<br/>
                Precio compra: $${producto.precio_compra.toLocaleString('es-CO')}<br/>
                Precio venta: $${producto.precio_venta.toLocaleString('es-CO')}`;
      }
    },
    credits: { enabled: false },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          formatter: function() {
            return this.y.toFixed(1) + '%';
          },
          style: { color: '#e3e3e3' }
        }
      }
    },
    series: [{
      name: 'Margen',
      data: reportData.rentabilidadProductos 
        ? reportData.rentabilidadProductos.slice(0, 10).map(item => item.margen_porcentaje)
        : [],
      color: '#FFC107'
    }]
  };

  // Configuración para gráfico de clasificación de rotación
  const rotacionInventarioConfig = {
    chart: {
      type: 'pie',
      backgroundColor: '#222831',
      style: {
        fontFamily: 'Arial, sans-serif',
        color: '#e3e3e3'
      }
    },
    title: {
      text: 'Clasificación de Productos por Rotación',
      style: { color: '#e3e3e3' }
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b> ({point.y} productos)'
    },
    accessibility: {
      point: {
        valueSuffix: '%'
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        colors: ['#4CAF50', '#FFC107', '#FF9800', '#F44336'],
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
          style: {
            color: '#e3e3e3'
          }
        }
      }
    },
    credits: { enabled: false },
    series: [{
      name: 'Productos',
      colorByPoint: true,
      data: reportData.inventario ? [
        {
          name: 'Alta rotación',
          y: reportData.inventario.filter(item => item.clasificacion === 'Alta rotación').length
        },
        {
          name: 'Rotación normal',
          y: reportData.inventario.filter(item => item.clasificacion === 'Rotación normal').length
        },
        {
          name: 'Baja rotación',
          y: reportData.inventario.filter(item => item.clasificacion === 'Baja rotación').length
        },
        {
          name: 'Sin movimiento',
          y: reportData.inventario.filter(item => item.clasificacion === 'Sin movimiento').length
        }
      ] : []
    }]
  };

  // Configuración para gráfico de alertas de stock
  const alertasStockConfig = {
    chart: {
      type: 'column',
      backgroundColor: '#222831',
      style: {
        fontFamily: 'Arial, sans-serif',
        color: '#e3e3e3'
      }
    },
    title: {
      text: 'Alertas de Inventario',
      style: { color: '#e3e3e3' }
    },
    xAxis: {
      categories: ['Sin stock', 'Stock bajo', 'Normal', 'Sobrestock'],
      labels: {
        style: { color: '#e3e3e3' }
      }
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Cantidad de Productos',
        style: { color: '#e3e3e3' }
      },
      labels: {
        style: { color: '#e3e3e3' }
      }
    },
    legend: {
      enabled: false
    },
    tooltip: {
      pointFormat: 'Cantidad: <b>{point.y}</b>'
    },
    credits: { enabled: false },
    plotOptions: {
      column: {
        colorByPoint: true,
        colors: ['#F44336', '#FF9800', '#4CAF50', '#2196F3']
      }
    },
    series: [{
      name: 'Alertas',
      data: reportData.inventario ? [
        reportData.inventario.filter(item => item.alerta === 'Sin stock').length,
        reportData.inventario.filter(item => item.alerta === 'Stock bajo').length,
        reportData.inventario.filter(item => item.alerta === null).length,
        reportData.inventario.filter(item => item.alerta === 'Sobrestock').length
      ] : []
    }]
  };

  // Función para mostrar un informe específico y cargar sus datos
  const handleShowReport = (reportId) => {
    setActiveReport(reportId);
    if (reportId === 1) {
      fetchReportData();
    } else if (reportId === 2) {
      fetchRentabilidadData();
    } else if (reportId === 3) {
      fetchInventarioData(); // Esta función tendría que ser implementada
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="reports-title">Informes y Estadísticas</h1>
          </Col>
        </Row>

        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger">{error}</Alert>
            </Col>
          </Row>
        )}

        {/* Botones de selección de informes */}
        <Row className="mb-5">
          <Col>
            <div className="reports-selection">
              <h2 className="selection-title">Selecciona un informe para visualizar</h2>
              <div className="reports-buttons">
                <Button 
                  className={`report-button ${activeReport === 1 ? 'active' : ''}`} 
                  onClick={() => handleShowReport(1)}
                >
                  <div className="report-icon">📊</div>
                  <div className="report-info">
                    <h3>Informe de Movimientos</h3>
                    <p>Visualiza estadísticas de movimientos por tipo y usuario</p>
                  </div>
                </Button>
                
                <Button 
                  className={`report-button ${activeReport === 2 ? 'active' : ''}`} 
                  onClick={() => handleShowReport(2)}
                   // disabled={true}
                >
                  <div className="report-icon">💰</div>
                  <div className="report-info">
                    <h3>Informe de Rentabilidad</h3>
                    <p>Análisis de rentabilidad por producto</p>
                  </div>
                
                </Button>
                
                <Button 
                  className={`report-button ${activeReport === 3 ? 'active' : ''}`} 
                  onClick={() => handleShowReport(3)}
                >
                  <div className="report-icon">📦</div>
                  <div className="report-info">
                    <h3>Informe de Inventario</h3>
                    <p>Estado actual del inventario y productos populares</p>
                  </div>
                  
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Mostrar el contenido del informe seleccionado */}
        {activeReport === 1 && (
          <>
            <Row className="mb-4">
              <Col>
                <Card className="filter-card">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Filtrar por Fecha</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleFiltroSubmit}>
                      <Row>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Fecha Inicio</Form.Label>
                            <Form.Control
                              type="date"
                              name="fechaInicio"
                              value={filtroFecha.fechaInicio}
                              onChange={handleFiltroChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Fecha Fin</Form.Label>
                            <Form.Control
                              type="date"
                              name="fechaFin"
                              value={filtroFecha.fechaFin}
                              onChange={handleFiltroChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-100"
                            disabled={loading}
                          >
                            {loading ? 'Cargando...' : 'Aplicar'}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center my-5">
                <div className="spinner"></div>
                <p className="mt-3">Cargando datos del informe...</p>
              </div>
            ) : (
              <Row>
                <Col lg={6} className="mb-4">
                  <Card className="chart-card h-100">
                    <Card.Header className="chart-header">
                      <h3>Distribución de Movimientos</h3>
                    </Card.Header>
                    <Card.Body>
                      {reportData.movimientosPorTipo && reportData.movimientosPorTipo.length > 0 ? (
                        <HighchartsReact highcharts={Highcharts} options={tipoMovimientosConfig} />
                      ) : (
                        <div className="text-center py-5">
                          <p>No hay datos disponibles de movimientos por tipo.</p>
                          <Button variant="outline-primary" onClick={() => {
                            console.log("Solicitando carga de datos de movimientos");
                            fetchReportData();
                          }}>
                            Cargar datos
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6} className="mb-4">
                  <Card className="chart-card h-100">
                    <Card.Header className="chart-header">
                      <h3>Actividad por Usuario</h3>
                    </Card.Header>
                    <Card.Body>
                      {reportData.movimientosPorUsuario && reportData.movimientosPorUsuario.length > 0 ? (
                        <HighchartsReact highcharts={Highcharts} options={usuarioMovimientosConfig} />
                      ) : (
                        <div className="text-center py-5">
                          <p>No hay datos disponibles de movimientos por usuario.</p>
                          <Button variant="outline-primary" onClick={() => {
                            console.log("Solicitando carga de datos de movimientos");
                            fetchReportData();
                          }}>
                            Cargar datos
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}

        {activeReport === 2 && (
          <>
            <Row className="mb-4">
              <Col>
                <Card className="filter-card">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Filtrar por Fecha</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleFiltroSubmit}>
                      <Row>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Fecha Inicio</Form.Label>
                            <Form.Control
                              type="date"
                              name="fechaInicio"
                              value={filtroFecha.fechaInicio}
                              onChange={handleFiltroChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Fecha Fin</Form.Label>
                            <Form.Control
                              type="date"
                              name="fechaFin"
                              value={filtroFecha.fechaFin}
                              onChange={handleFiltroChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-100"
                            disabled={loading}
                            onClick={() => fetchRentabilidadData(filtroFecha.fechaInicio, filtroFecha.fechaFin)}
                          >
                            {loading ? 'Cargando...' : 'Aplicar'}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center my-5">
                <div className="spinner"></div>
                <p className="mt-3">Cargando datos del informe...</p>
              </div>
            ) : (
              <>
                <Row>
                  <Col lg={6} className="mb-4">
                    <Card className="chart-card h-100">
                      <Card.Header className="chart-header">
                        <h3>Top 10 Productos por Rentabilidad Total</h3>
                      </Card.Header>
                      <Card.Body>
                        {reportData.rentabilidadProductos && reportData.rentabilidadProductos.length > 0 ? (
                          <HighchartsReact highcharts={Highcharts} options={rentabilidadProductosConfig} />
                        ) : (
                          <div className="text-center py-5">
                            <p>No hay datos disponibles de rentabilidad por producto.</p>
                            <Button variant="outline-primary" onClick={() => {
                              console.log("Solicitando carga de datos de rentabilidad");
                              fetchRentabilidadData();
                            }}>
                              Cargar datos
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <Card className="chart-card h-100">
                      <Card.Header className="chart-header">
                        <h3>Margen de Ganancia por Producto (%)</h3>
                      </Card.Header>
                      <Card.Body>
                        {reportData.rentabilidadProductos && reportData.rentabilidadProductos.length > 0 ? (
                          <HighchartsReact highcharts={Highcharts} options={margenPorcentajeConfig} />
                        ) : (
                          <div className="text-center py-5">
                            <p>No hay datos disponibles de márgenes por producto.</p>
                            <Button variant="outline-primary" onClick={() => {
                              console.log("Solicitando carga de datos de rentabilidad");
                              fetchRentabilidadData();
                            }}>
                              Cargar datos
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Card className="chart-card">
                      <Card.Header className="chart-header">
                        <h3>Tabla de Rentabilidad por Producto</h3>
                      </Card.Header>
                      <Card.Body>
                        {reportData.rentabilidadProductos && reportData.rentabilidadProductos.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-dark table-hover">
                              <thead>
                                <tr>
                                  <th>Código</th>
                                  <th>Nombre</th>
                                  <th>Precio Compra</th>
                                  <th>Precio Venta</th>
                                  <th>Margen Unitario</th>
                                  <th>Margen (%)</th>
                                  <th>Unidades Vendidas</th>
                                  <th>Rentabilidad Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.rentabilidadProductos.map((producto) => (
                                  <tr key={producto.id_producto}>
                                    <td>{producto.codigo}</td>
                                    <td>{producto.nombre}</td>
                                    <td>${producto.precio_compra.toLocaleString('es-CO')}</td>
                                    <td>${producto.precio_venta.toLocaleString('es-CO')}</td>
                                    <td>${producto.margen_unitario.toLocaleString('es-CO')}</td>
                                    <td>{producto.margen_porcentaje.toFixed(2)}%</td>
                                    <td>{producto.cantidad_vendida}</td>
                                    <td>${producto.rentabilidad_total.toLocaleString('es-CO')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <p>No hay datos disponibles para mostrar.</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </>
        )}

        {activeReport === 3 && (
          <>
            <Row className="mb-4">
              <Col>
                <Card className="filter-card">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Filtrar por Fecha</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={(e) => {
                      e.preventDefault();
                      fetchInventarioData(filtroFecha.fechaInicio, filtroFecha.fechaFin);
                    }}>
                      <Row>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Fecha Inicio</Form.Label>
                            <Form.Control
                              type="date"
                              name="fechaInicio"
                              value={filtroFecha.fechaInicio}
                              onChange={handleFiltroChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={5}>
                          <Form.Group>
                            <Form.Label>Fecha Fin</Form.Label>
                            <Form.Control
                              type="date"
                              name="fechaFin"
                              value={filtroFecha.fechaFin}
                              onChange={handleFiltroChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-100"
                            disabled={loading}
                          >
                            {loading ? 'Cargando...' : 'Aplicar'}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center my-5">
                <div className="spinner"></div>
                <p className="mt-3">Cargando datos del informe...</p>
              </div>
            ) : (
              <>
                <Row>
                  <Col lg={6} className="mb-4">
                    <Card className="chart-card h-100">
                      <Card.Header className="chart-header">
                        <h3>Clasificación de Rotación de Inventario</h3>
                      </Card.Header>
                      <Card.Body>
                        {reportData.inventario && reportData.inventario.length > 0 ? (
                          <HighchartsReact highcharts={Highcharts} options={rotacionInventarioConfig} />
                        ) : (
                          <div className="text-center py-5">
                            <p>No hay datos disponibles de rotación de inventario.</p>
                            <Button variant="outline-primary" onClick={() => {
                              console.log("Solicitando carga de datos de inventario");
                              fetchInventarioData();
                            }}>
                              Cargar datos
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col lg={6} className="mb-4">
                    <Card className="chart-card h-100">
                      <Card.Header className="chart-header">
                        <h3>Alertas de Stock</h3>
                      </Card.Header>
                      <Card.Body>
                        {reportData.inventario && reportData.inventario.length > 0 ? (
                          <HighchartsReact highcharts={Highcharts} options={alertasStockConfig} />
                        ) : (
                          <div className="text-center py-5">
                            <p>No hay datos disponibles de alertas de stock.</p>
                            <Button variant="outline-primary" onClick={() => {
                              console.log("Solicitando carga de datos de inventario");
                              fetchInventarioData();
                            }}>
                              Cargar datos
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Card className="chart-card">
                      <Card.Header className="chart-header">
                        <h3>Estado del Inventario y Movimientos</h3>
                      </Card.Header>
                      <Card.Body>
                        {reportData.inventario && reportData.inventario.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-dark table-hover">
                              <thead>
                                <tr>
                                  <th>Código</th>
                                  <th>Nombre</th>
                                  <th>Categoría</th>
                                  <th>Stock Actual</th>
                                  <th>Entradas</th>
                                  <th>Salidas</th>
                                  <th>Rotación</th>
                                  <th>Clasificación</th>
                                  <th>Días sin movimiento</th>
                                  <th>Alerta</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.inventario.map((item) => (
                                  <tr key={item.id_producto} className={
                                    item.alerta === 'Sin stock' ? 'table-danger' : 
                                    item.alerta === 'Stock bajo' ? 'table-warning' :
                                    item.alerta === 'Sobrestock' ? 'table-info' : ''
                                  }>
                                    <td>{item.codigo}</td>
                                    <td>{item.nombre}</td>
                                    <td>{item.categoria}</td>
                                    <td className="text-center">{item.stock_actual}</td>
                                    <td className="text-center">{item.total_entradas}</td>
                                    <td className="text-center">{item.total_salidas}</td>
                                    <td className="text-center">{item.rotacion.toFixed(2)}</td>
                                    <td>
                                      <span className={
                                        item.clasificacion === 'Alta rotación' ? 'badge bg-success' :
                                        item.clasificacion === 'Rotación normal' ? 'badge bg-primary' :
                                        item.clasificacion === 'Baja rotación' ? 'badge bg-warning' :
                                        'badge bg-danger'
                                      }>
                                        {item.clasificacion}
                                      </span>
                                    </td>
                                    <td className="text-center">{item.dias_sin_movimiento}</td>
                                    <td>
                                      {item.alerta && (
                                        <span className={
                                          item.alerta === 'Sin stock' ? 'badge bg-danger' :
                                          item.alerta === 'Stock bajo' ? 'badge bg-warning' :
                                          item.alerta === 'Sobrestock' ? 'badge bg-info' : ''
                                        }>
                                          {item.alerta}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <p>No hay datos disponibles para mostrar.</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </>
        )}
        
        {!activeReport && (
          <Row>
            <Col>
              <div className="text-center select-report-prompt">
                <h3>👆 Selecciona un informe para comenzar</h3>
                <p>Escoge uno de los informes disponibles para visualizar las estadísticas correspondientes</p>
              </div>
            </Col>
          </Row>
        )}
        
      </Container>
    </div>
  );
};

export default Reportes;