module.exports = (err, req, res, next) => {
    console.error(err.stack);
    
    res.status(500).json({
      success: false,
      message: err.message || 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  };