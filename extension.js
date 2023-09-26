export default async function (input) {
   exec('log', input);

   const output = await exec('read-item');

   exec('log', output);
}