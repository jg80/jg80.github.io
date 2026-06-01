import * as THREE from "three";

export interface SimBody {
  id: number;
  mass: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  color: string;
  fixed?: boolean;
  trail: THREE.Vector3[];
}

const TRAIL_LENGTH = 40;
const SOFTENING = 0.35;
const RESTITUTION = 0.82;
const MAX_DISTANCE = 45;
const MAX_SPEED = 12;

export const STAR_MASS = 500;
export const DEFAULT_GRAVITY = 2.5;

export function createBody(
  id: number,
  mass: number,
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  radius: number,
  color: string,
  fixed = false
): SimBody {
  return {
    id,
    mass,
    position: position.clone(),
    velocity: velocity.clone(),
    radius,
    color,
    fixed,
    trail: [position.clone()],
  };
}

function inverseMass(body: SimBody): number {
  return body.fixed ? 0 : 1 / body.mass;
}

function resolvePairCollision(a: SimBody, b: SimBody) {
  const diff = new THREE.Vector3().subVectors(b.position, a.position);
  const dist = diff.length();
  const minDist = a.radius + b.radius;

  if (dist >= minDist) return;

  const normal =
    dist > 1e-6 ? diff.clone().divideScalar(dist) : new THREE.Vector3(1, 0, 0);
  const overlap = minDist - dist;

  const invMassA = inverseMass(a);
  const invMassB = inverseMass(b);
  const invMassSum = invMassA + invMassB;

  if (invMassSum > 0) {
    const separationA = overlap * (invMassA / invMassSum);
    const separationB = overlap * (invMassB / invMassSum);
    if (invMassA > 0) a.position.addScaledVector(normal, -separationA);
    if (invMassB > 0) b.position.addScaledVector(normal, separationB);
  }

  const relativeVelocity = new THREE.Vector3().subVectors(b.velocity, a.velocity);
  const velocityAlongNormal = relativeVelocity.dot(normal);
  if (velocityAlongNormal > 0) return;

  const impulseScalar =
    (-(1 + RESTITUTION) * velocityAlongNormal) / Math.max(invMassSum, 1e-6);

  if (invMassA > 0) {
    a.velocity.addScaledVector(normal, -impulseScalar * invMassA);
  }
  if (invMassB > 0) {
    b.velocity.addScaledVector(normal, impulseScalar * invMassB);
  }
}

function resolveCollisions(bodies: SimBody[]) {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      resolvePairCollision(bodies[i], bodies[j]);
    }
  }
}

function clampBodyToArena(body: SimBody) {
  if (body.fixed) return;

  const distance = body.position.length();
  if (distance > MAX_DISTANCE) {
    body.position.setLength(MAX_DISTANCE);
    const normal = body.position.clone().normalize();
    const outwardSpeed = body.velocity.dot(normal);
    if (outwardSpeed > 0) {
      body.velocity.addScaledVector(normal, -outwardSpeed * 1.1);
    }
  }

  const speed = body.velocity.length();
  if (speed > MAX_SPEED) {
    body.velocity.multiplyScalar(MAX_SPEED / speed);
  }
}

function updateTrail(body: SimBody) {
  if (body.fixed) return;
  body.trail.push(body.position.clone());
  if (body.trail.length > TRAIL_LENGTH) {
    body.trail.shift();
  }
}

export function removeBodiesHittingStar(bodies: SimBody[]): SimBody[] {
  const star = bodies.find((body) => body.fixed);
  if (!star) return bodies;

  return bodies.filter((body) => {
    if (body.fixed) return true;
    const distance = body.position.distanceTo(star.position);
    return distance > star.radius * 0.95;
  });
}

export function stepSimulation(bodies: SimBody[], dt: number, gravitationalConstant: number) {
  const accelerations = bodies.map(() => new THREE.Vector3());

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const diff = new THREE.Vector3().subVectors(bodies[j].position, bodies[i].position);
      const distSq = diff.lengthSq() + SOFTENING * SOFTENING;
      const dist = Math.sqrt(distSq);
      const forceMagnitude =
        (gravitationalConstant * bodies[i].mass * bodies[j].mass) / distSq;
      const direction = diff.clone().divideScalar(dist);

      if (!bodies[i].fixed) {
        accelerations[i].add(direction.clone().multiplyScalar(forceMagnitude / bodies[i].mass));
      }
      if (!bodies[j].fixed) {
        accelerations[j].add(direction.clone().multiplyScalar(-forceMagnitude / bodies[j].mass));
      }
    }
  }

  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].fixed) continue;

    bodies[i].velocity.add(accelerations[i].multiplyScalar(dt));
    bodies[i].position.addScaledVector(bodies[i].velocity, dt);
    updateTrail(bodies[i]);
    clampBodyToArena(bodies[i]);
  }

  resolveCollisions(bodies);

  for (const body of bodies) {
    if (!body.fixed) {
      clampBodyToArena(body);
    }
  }
}

export function tangentialVelocityAt(
  point: THREE.Vector3,
  speed: number
): THREE.Vector3 {
  const toStar = point.clone().negate();
  if (toStar.lengthSq() < 1e-4) {
    return new THREE.Vector3(speed, 0, 0);
  }

  const tangent = new THREE.Vector3(-toStar.z, 0, toStar.x).normalize();
  return tangent.multiplyScalar(speed);
}

export function circularOrbitSpeed(
  point: THREE.Vector3,
  gravitationalConstant: number,
  centralMass = STAR_MASS
): number {
  const radius = Math.max(point.length(), 1.5);
  return Math.sqrt((gravitationalConstant * centralMass) / radius);
}

export function createInitialSystem(gravitationalConstant = DEFAULT_GRAVITY): SimBody[] {
  const star = createBody(
    0,
    STAR_MASS,
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(),
    1.2,
    "#ffcc66",
    true
  );

  const planetAPosition = new THREE.Vector3(9, 0, 0);
  const planetBPosition = new THREE.Vector3(-9, 0, 2);

  const planetA = createBody(
    1,
    8,
    planetAPosition,
    tangentialVelocityAt(
      planetAPosition,
      circularOrbitSpeed(planetAPosition, gravitationalConstant)
    ),
    0.35,
    "#88aaff"
  );

  const planetB = createBody(
    2,
    5,
    planetBPosition,
    tangentialVelocityAt(
      planetBPosition,
      circularOrbitSpeed(planetBPosition, gravitationalConstant)
    ),
    0.28,
    "#88ffcc"
  );

  return [star, planetA, planetB];
}

export type SpawnKind = "asteroid" | "planet";

export function createSpawnedBody(
  id: number,
  point: THREE.Vector3,
  kind: SpawnKind,
  speed: number,
  gravitationalConstant: number
): SimBody {
  const orbitalSpeed = circularOrbitSpeed(point, gravitationalConstant);
  const spawnSpeed = speed <= 0 ? orbitalSpeed : speed;
  const velocity = tangentialVelocityAt(point, spawnSpeed);

  if (kind === "planet") {
    return createBody(
      id,
      4 + Math.random() * 3,
      point,
      velocity,
      0.28 + Math.random() * 0.1,
      "#aabbff"
    );
  }

  return createBody(
    id,
    0.4 + Math.random() * 0.3,
    point,
    velocity,
    0.12 + Math.random() * 0.08,
    "#c8c8c8"
  );
}
