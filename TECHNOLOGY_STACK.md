# 🛠️ Technology Stack

## Complete Technology Documentation for CrisisFlow

This document provides a comprehensive breakdown of all technologies, frameworks, libraries, and tools used in the CrisisFlow disaster response platform.

---

## 📋 Table of Contents

- [Frontend Technologies](#frontend-technologies)
- [Backend Technologies](#backend-technologies)
- [AI/ML Technologies](#aiml-technologies)
- [Database Technologies](#database-technologies)
- [DevOps & Infrastructure](#devops--infrastructure)
- [Development Tools](#development-tools)

---

## 🎨 Frontend Technologies

### Core Framework

| Technology | Version | Purpose | Documentation |
|-----------|---------|---------|--------------|
| **React** | 18.2.0 | Component-based UI library | [react.dev](https://react.dev) |
| **React DOM** | 18.2.0 | React rendering for web | [react.dev/reference/react-dom](https://react.dev/reference/react-dom) |
| **Vite** | 5.0.11 | Next-generation frontend build tool | [vitejs.dev](https://vitejs.dev) |

**Why React?**
- Component reusability and modularity
- Virtual DOM for optimal performance
- Large ecosystem and community support
- Excellent for real-time updates with state management

**Why Vite?**
- Lightning-fast Hot Module Replacement (HMR)
- Optimized build times
- Native ES modules support
- Better developer experience than Webpack

### Routing & Navigation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Router DOM** | 6.21.0 | Client-side routing and navigation |

**Features Used:**
- Browser-based routing (`BrowserRouter`)
- Route parameter handling
- Programmatic navigation
- Nested routes support

### UI & Styling

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TailwindCSS** | 3.4.1 | Utility-first CSS framework |
| **PostCSS** | 8.4.33 | CSS transformation tool |
| **Autoprefixer** | 10.4.16 | CSS vendor prefix automation |
| **Lucide React** | 0.303.0 | Modern icon library |
| **clsx** | 2.1.0 | Conditional className utility |

**TailwindCSS Configuration:**
```javascript
// Custom color scheme
colors: {
  'crisis-red': '#DC2626',
  'crisis-orange': '#EA580C',
  'crisis-green': '#059669',
}
```

### Maps & Geospatial Visualization

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Leaflet.js** | 1.9.4 | Interactive map library |
| **React Leaflet** | 4.2.1 | React components for Leaflet |

**Features Implemented:**
- Custom marker icons with SVG
- Dynamic popup rendering
- Map clustering
- Geolocation integration
- Tile layer configuration (OpenStreetMap)

### Data Visualization

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Recharts** | 2.10.3 | Composable charting library |

**Charts Used:**
- Bar charts (incident types)
- Pie charts (status distribution)
- Line charts (timeline trends)
- Responsive containers

### HTTP Client

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Axios** | 1.6.5 | Promise-based HTTP client |

**Configuration:**
- Base URL configuration
- Request/response interceptors
- Multipart form-data support
- Error handling

### Utility Libraries

| Technology | Version | Purpose |
|-----------|---------|---------|
| **date-fns** | 3.0.6 | Modern date utility library |

**Functions Used:**
- `formatDistanceToNow()` - Relative time display
- `format()` - Date formatting
- Timezone handling

### Development Dependencies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **ESLint** | 8.56.0 | JavaScript/React linter |
| **eslint-plugin-react** | 7.33.2 | React-specific linting rules |
| **eslint-plugin-react-hooks** | 4.6.0 | React Hooks linting |
| **@vitejs/plugin-react** | 4.2.1 | Vite React plugin with Fast Refresh |

---

## ⚙️ Backend Technologies

### Core Framework

| Technology | Version | Purpose | Documentation |
|-----------|---------|---------|--------------|
| **FastAPI** | 0.109.0 | Modern async web framework | [fastapi.tiangolo.com](https://fastapi.tiangolo.com) |
| **Uvicorn** | 0.27.0 | ASGI server with uvloop | [uvicorn.org](https://www.uvicorn.org) |
| **Python** | 3.11+ | Programming language | [python.org](https://www.python.org) |

**Why FastAPI?**
- Native async/await support for high concurrency
- Automatic API documentation (OpenAPI/Swagger)
- Type hints with Pydantic validation
- Best-in-class performance (comparable to NodeJS/Go)
- Built-in security features

### API & Web

| Technology | Version | Purpose |
|-----------|---------|---------|
| **python-multipart** | 0.0.6 | Multipart form data parsing |
| **aiofiles** | 23.2.1 | Async file operations |

**Features:**
- File upload handling
- Streaming responses
- WebSocket support (ready)

### Database ORM & Migrations

| Technology | Version | Purpose |
|-----------|---------|---------|
| **SQLAlchemy** | 2.0.25 | SQL toolkit and ORM |
| **Alembic** | 1.13.1 | Database migration tool |
| **psycopg2-binary** | 2.9.9 | PostgreSQL adapter |
| **GeoAlchemy2** | 0.14.3 | Spatial database extensions for SQLAlchemy |
| **pgvector** | 0.2.5 | PostgreSQL vector similarity extension |

**SQLAlchemy Features Used:**
- Async session support
- Relationship mapping
- Query building
- Connection pooling
- Transaction management

### Authentication & Security

| Technology | Version | Purpose |
|-----------|---------|---------|
| **python-jose[cryptography]** | 3.3.0 | JWT token handling |
| **passlib[bcrypt]** | 1.7.4 | Password hashing |
| **python-dotenv** | 1.0.0 | Environment variable management |

**Security Implementations:**
- JWT-based authentication (ready)
- Bcrypt password hashing
- CORS middleware
- Input validation with Pydantic

### Validation & Configuration

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Pydantic** | 2.5.3 | Data validation using Python type hints |
| **pydantic-settings** | 2.1.0 | Settings management |

**Pydantic Features:**
- Email validation
- Field constraints
- Nested models
- JSON schema generation
- Environment variable parsing

---

## 🤖 AI/ML Technologies

### Deep Learning Framework

| Technology | Version | Purpose | Documentation |
|-----------|---------|---------|--------------|
| **PyTorch** | 2.9.1 | Deep learning framework | [pytorch.org](https://pytorch.org) |
| **TorchVision** | 0.24.1 | Computer vision library | [pytorch.org/vision](https://pytorch.org/vision) |

**Why PyTorch?**
- Dynamic computation graphs
- Pythonic and intuitive API
- Strong ecosystem for computer vision
- GPU acceleration support
- Excellent for production deployment

### Computer Vision Models

#### 1. EfficientNetV2 (via TIMM)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **TIMM** | 0.9.12 | PyTorch Image Models |

**Model Details:**
- **Architecture**: EfficientNetV2-Small
- **Parameters**: ~21M
- **Input Size**: 384×384
- **Task**: Multi-label disaster classification
- **Classes**: Fire, Flood, Safe
- **Activation**: Sigmoid (multi-label)

**Why EfficientNetV2?**
- State-of-the-art accuracy/efficiency trade-off
- Faster training and inference than EfficientNetV1
- Progressive learning support
- Excellent for mobile/edge deployment

#### 2. CLIP (Contrastive Language-Image Pre-training)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **CLIP** | Latest (from OpenAI) | Vision-language model |
| **ftfy** | 6.1.3 | Text normalization for CLIP |
| **regex** | 2023.12.25 | Pattern matching for CLIP |

**Model Details:**
- **Architecture**: ViT-B/32 (Vision Transformer)
- **Embedding Dimension**: 512
- **Purpose**: Semantic image embeddings
- **Use Case**: Duplicate detection via cosine similarity

**Why CLIP?**
- Joint vision-language understanding
- Zero-shot capabilities
- Robust semantic embeddings
- Pre-trained on 400M image-text pairs

**CLIP Pipeline:**
```
Image → CLIP Encoder → 512-dim embedding → L2 normalization → pgvector storage
Query → Cosine similarity search → Duplicate detection (threshold: 0.95)
```

### Natural Language Processing

#### GLiNER (Generalist Named Entity Recognition)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **GLiNER** | 0.2.8 | Zero-shot named entity recognition |

**Model Details:**
- **Base Model**: `urchade/gliner_base`
- **Architecture**: Bidirectional transformer
- **Task**: Zero-shot entity extraction
- **Supported Languages**: English, multilingual (Sinhala, Singlish)

**Entity Labels Extracted:**
```python
[
    "Location",           # Geographic locations
    "Urgency",           # Critical, high, medium, low
    "Resource_Needed",   # Water, food, medical supplies
    "Person_Count",      # Number of people affected
    "Contact_Info"       # Phone numbers, addresses
]
```

**Why GLiNER?**
- No fine-tuning required
- Works with noisy, fragmented text
- Multi-language support
- Low-resource language capability
- Adaptive to new entity types

### Image Processing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Pillow (PIL)** | 11.0.0 | Image manipulation |
| **OpenCV** | 4.10.0.84 | Advanced computer vision |

**Operations:**
- Image loading and preprocessing
- Format conversion (RGB, grayscale)
- Resizing and normalization
- EXIF metadata extraction
- Image quality assessment

### Geospatial Libraries

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Shapely** | 2.0.6 | Geometric operations |

**Features:**
- Point, polygon manipulation
- Spatial relationship testing
- Geometric transformations

### Utilities

| Technology | Version | Purpose |
|-----------|---------|---------|
| **NumPy** | 2.2.1 | Numerical computing |
| **Requests** | 2.31.0 | HTTP library |
| **python-dateutil** | 2.8.2 | Date/time utilities |

---

## 🗄️ Database Technologies

### Primary Database

| Technology | Version | Purpose | Documentation |
|-----------|---------|---------|--------------|
| **PostgreSQL** | 15 | Relational database | [postgresql.org](https://www.postgresql.org) |

**Configuration:**
- Connection pooling
- SSL support (ready)
- Async driver support
- JSON/JSONB support
- Full-text search

### Spatial Extension

| Technology | Version | Purpose |
|-----------|---------|---------|
| **PostGIS** | 3.3+ | Geographic objects for PostgreSQL |

**Features Used:**
- `GEOMETRY(Point, 4326)` - WGS84 coordinate system
- `ST_ClusterDBSCAN` - Spatial clustering algorithm
- `ST_DWithin` - Distance queries
- `ST_Distance` - Geodesic distance calculation
- Spatial indexing (GIST)

**Clustering Algorithm:**
```sql
ST_ClusterDBSCAN(
    location,
    eps := 0.005,      -- ~500 meters in degrees
    minpoints := 3      -- Minimum 3 incidents to form cluster
) OVER ()
```

### Vector Similarity Search

| Technology | Version | Purpose |
|-----------|---------|---------|
| **pgvector** | 0.2.5 | Vector similarity search extension |

**Features:**
- `VECTOR(512)` - 512-dimensional embeddings storage
- Cosine similarity (`<=>` operator)
- L2 distance (`<->` operator)
- IVFFlat indexing for performance

**Similarity Query:**
```sql
SELECT id, title, 
       1 - (clip_embedding <=> query_embedding::vector) AS similarity
FROM incidents
WHERE 1 - (clip_embedding <=> query_embedding::vector) > 0.95
ORDER BY similarity DESC;
```

### Database Schema

**Key Tables:**
- `incidents` - Core incident data
- `users` - Responder accounts
- Spatial indexes on `location` field
- Vector indexes on `clip_embedding` field

---

## 🐳 DevOps & Infrastructure

### Containerization

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Docker** | 20.10+ | Container platform |
| **Docker Compose** | 2.0+ | Multi-container orchestration |

**Services Defined:**
1. **db** - PostgreSQL with PostGIS and pgvector
2. **backend** - FastAPI application
3. **frontend** - React/Vite development server

**Docker Images:**
- Backend: `python:3.11-slim`
- Frontend: `node:20-alpine`
- Database: `pgvector/pgvector:pg15`

### Volume Management

```yaml
volumes:
  postgres_data:      # Database persistence
  model_cache:        # AI model caching
  uploads:            # User-uploaded files
```

### Networking

- Bridge network (default)
- Port mapping: 5173 (frontend), 8000 (backend), 5432 (database)
- Internal DNS resolution

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/crisisflow_db

# AI
TORCH_DEVICE=cpu
MODEL_CACHE_DIR=/root/.cache

# Application
DEBUG=True
ALLOWED_ORIGINS=["http://localhost:5173"]
```

---

## 🧪 Development Tools

### Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Pytest** | 7.4.4 | Python testing framework |
| **pytest-asyncio** | 0.23.3 | Async test support |
| **httpx** | 0.26.0 | Async HTTP client for testing |

**Test Coverage:**
- Unit tests for AI services
- Integration tests for API endpoints
- System tests for end-to-end flows

### Code Quality

| Technology | Purpose |
|-----------|---------|
| **ESLint** | JavaScript/React linting |
| **Prettier** | Code formatting (optional) |
| **Black** | Python code formatting |
| **Flake8** | Python linting |

### Version Control

| Technology | Purpose |
|-----------|---------|
| **Git** | Source control |
| **GitHub** | Repository hosting |

---

## 📊 Technology Comparison & Justification

### Frontend: React vs Alternatives

| Framework | Pros | Cons | Why Not? |
|-----------|------|------|----------|
| **React** ✅ | Large ecosystem, component reuse, virtual DOM | Boilerplate | **SELECTED** |
| Vue.js | Easier learning curve, smaller | Smaller ecosystem | Good alternative |
| Angular | Full framework, TypeScript native | Heavy, steep learning | Over-engineered |
| Svelte | No virtual DOM, faster | Smaller ecosystem | Less mature |

### Backend: FastAPI vs Alternatives

| Framework | Pros | Cons | Why Not? |
|-----------|------|------|----------|
| **FastAPI** ✅ | Async, auto docs, type safety | Newer | **SELECTED** |
| Django | Mature, batteries included | Slower, not async-first | Too heavy |
| Flask | Lightweight, flexible | No async, manual setup | Lacks features |
| Express.js | Popular, fast | JavaScript limitations | Not ideal for ML |

### AI: PyTorch vs TensorFlow

| Framework | Pros | Cons | Why Not? |
|-----------|------|------|----------|
| **PyTorch** ✅ | Pythonic, dynamic, research-friendly | - | **SELECTED** |
| TensorFlow | Production-ready, mobile support | Complex API, static graphs | More complex |

### Database: PostgreSQL vs Alternatives

| Database | Pros | Cons | Why Not? |
|-----------|------|------|----------|
| **PostgreSQL** ✅ | Extensions (PostGIS, pgvector), ACID | - | **SELECTED** |
| MySQL | Popular, simple | Limited extensions | No vector search |
| MongoDB | Flexible schema | No spatial/vector | Not relational |

---

## 🔄 Technology Dependencies Graph

```
Frontend (React + Vite)
    ↓ HTTP REST API
Backend (FastAPI + Uvicorn)
    ↓ SQLAlchemy ORM
    ├─→ PostgreSQL (Core Data)
    ├─→ PostGIS (Spatial Queries)
    └─→ pgvector (Similarity Search)
    ↓ AI/ML Services
    ├─→ PyTorch (Framework)
    ├─→ EfficientNetV2 via TIMM (Classification)
    ├─→ CLIP (Embeddings)
    └─→ GLiNER (NLP Entity Extraction)
```

---

## 📈 Performance Characteristics

| Component | Metric | Value |
|-----------|--------|-------|
| FastAPI | Requests/sec | 5,000+ |
| React | First Contentful Paint | <1.5s |
| PyTorch Inference (CPU) | Images/sec | 2-5 |
| PostgreSQL | Queries/sec | 10,000+ |
| pgvector Search | 512-dim similarity | <50ms |

---

## 🚀 Future Technology Additions

### Planned (Phase 2)
- **Redis** - Caching and session management
- **Celery** - Background task queue
- **RabbitMQ** - Message broker
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

### Under Consideration (Phase 3)
- **Kubernetes** - Container orchestration
- **Kafka** - Event streaming
- **Elasticsearch** - Full-text search
- **TensorFlow Lite** - Mobile inference
- **GraphQL** - Alternative API layer

---

## 📚 Learning Resources

### Official Documentation
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Documentation](https://react.dev/learn)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Recommended Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Deep Learning with PyTorch" by Eli Stevens
- "Fluent React" by Tejas Kumar

### Online Courses
- [FastAPI - The Complete Course](https://www.udemy.com/course/fastapi-the-complete-course/)
- [React - The Complete Guide](https://www.udemy.com/course/react-the-complete-guide-incl-redux/)
- [Deep Learning Specialization](https://www.deeplearning.ai/)

---

## 📞 Technology Support

For technology-specific questions:
- **FastAPI**: [GitHub Discussions](https://github.com/tiangolo/fastapi/discussions)
- **React**: [React Community](https://react.dev/community)
- **PyTorch**: [PyTorch Forums](https://discuss.pytorch.org/)
- **PostgreSQL**: [Mailing Lists](https://www.postgresql.org/list/)

---
